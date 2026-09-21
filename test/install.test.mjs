import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile, realpath, symlink, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { install, skillNames } from '../lib/install.mjs';
const cli = fileURLToPath(new URL('../bin/hownter.mjs', import.meta.url));
async function temp(t) { const p = await realpath(await mkdtemp(path.join(os.tmpdir(), 'hownter-test-'))); t.after(() => rm(p, { recursive: true, force: true })); return p; }
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

for (const agent of ['claude', 'cursor', 'codex']) {
  test(`${agent} project install is complete and idempotent`, async t => {
    const cwd = await temp(t); const result = await install({ agent, cwd });
    assert.equal(result.length, 7);
    for (const entry of result) {
      const skill = await readFile(path.join(entry.destination, 'SKILL.md'), 'utf8');
      assert.match(skill.replace(/\r\n/g, '\n'), /^---\nname:/);
    }
    assert.ok((await install({ agent, cwd })).every(r => r.action === 'unchanged'));
  });
}
test('dry run creates nothing; global uses only designated home', async t => {
  const cwd = await temp(t); const home = await temp(t);
  await install({ cwd, agent: 'claude', dryRun: true });
  assert.deepEqual(await readdir(cwd), []);
  const result = await install({ cwd, home, global: true, agent: 'claude' });
  assert.ok(result.every(r => r.destination.startsWith(home + path.sep)));
  assert.deepEqual(await readdir(cwd), []);
});
test('conflict preflight protects files; force preserves originals', async t => {
  const cwd = await temp(t);
  const entries = await install({ cwd });
  const file = path.join(entries[0].destination, 'SKILL.md');
  await writeFile(file, 'user customization');
  await assert.rejects(install({ cwd }), /Existing files differ/);
  assert.equal(await readFile(file, 'utf8'), 'user customization');
  const result = await install({ cwd, force: true });
  assert.equal(await readFile(path.join(result[0].backup, 'SKILL.md'), 'utf8'), 'user customization');
  assert.match(await readFile(file, 'utf8'), /^---/);
  assert.ok(!result[0].backup.includes(`${path.sep}skills${path.sep}`));
});
test('symlinked destinations are rejected', async t => {
  if (process.platform === 'win32') return t.skip('Symlink permissions vary on Windows; Unix test covers rejection.');
  const cwd = await temp(t); const other = await temp(t);
  await symlink(other, path.join(cwd, '.agents'));
  await assert.rejects(install({ cwd }), /Refusing symlink/);
  assert.deepEqual(await readdir(other), []);
});
test('symlink inside skill tree is rejected even with force', async t => {
  if (process.platform === 'win32') return t.skip('Requires Unix symlink support');
  const cwd = await temp(t); const entries = await install({ cwd });
  await symlink('/does-not-exist', path.join(entries[0].destination, 'unexpected'));
  await assert.rejects(install({ cwd, force: true }), /Refusing symlink/);
});
test('unknown agent and invalid arguments fail without writes', async t => {
  const cwd = await temp(t);
  await assert.rejects(install({ cwd, agent: '../escape' }), /Unknown agent/);
  for (const args of [['install', '--agent', 'bad'], ['init', '--force'], ['list', 'extra'], ['coverage', 'x', '--min-coverage', 'NaN'], ['install', '--typo']]) assert.equal(run(...args).status, 1);
  assert.deepEqual(await readdir(cwd), []);
});
test('init refuses overwrite; provisional coverage fails threshold', async t => {
  const cwd = await temp(t);
  assert.equal(run('init', '--cwd', cwd).status, 0);
  assert.equal(run('init', '--cwd', cwd).status, 1);
  const file = path.join(cwd, 'security/threat-models/assessment.json');
  assert.equal(run('validate', file).status, 0);
  const result = run('coverage', file, '--min-coverage', '100');
  assert.equal(result.status, 2);
  assert.equal(JSON.parse(result.stdout).percentage, null);
});
test('installed validator works independently of npm package', async t => {
  const cwd = await temp(t); const entries = await install({ cwd });
  const dir = entries.find(e => e.name === 'hownter-threat-model').destination;
  const result = spawnSync(process.execPath, [path.join(dir, 'scripts/assessment.mjs'), 'validate', path.join(dir, 'assets/assessment.template.json')], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});
test('list and version work', async () => {
  assert.equal(run('--version').stdout.trim(), '0.1.0');
  assert.equal(run('list').stdout.trim().split('\n').length, (await skillNames()).length);
});
