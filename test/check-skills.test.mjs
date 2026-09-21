import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repository = fileURLToPath(new URL('../', import.meta.url));

async function fixture(t, eol) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'hownter-check-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await cp(path.join(repository, 'scripts'), path.join(root, 'scripts'), { recursive: true });
  await cp(path.join(repository, 'skills'), path.join(root, 'skills'), { recursive: true });
  for (const name of await readdir(path.join(root, 'skills'))) {
    const filename = path.join(root, 'skills', name, 'SKILL.md');
    const content = (await readFile(filename, 'utf8')).replace(/\r\n/g, '\n').replace(/\n/g, eol);
    await writeFile(filename, content);
  }
  return root;
}

function check(root) {
  return spawnSync(process.execPath, [path.join(root, 'scripts/check-skills.mjs')], { encoding: 'utf8' });
}

for (const [label, eol] of [['LF', '\n'], ['CRLF', '\r\n']]) {
  test(`skill checker accepts ${label} files`, async t => {
    const result = check(await fixture(t, eol));
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Validated 7 skill metadata files/);
  });
}

test('CRLF normalization still rejects invalid metadata and broken links', async t => {
  const root = await fixture(t, '\r\n');
  const filename = path.join(root, 'skills/hownter-architecture/SKILL.md');
  const original = await readFile(filename, 'utf8');
  await writeFile(filename, original.replace('name: hownter-architecture', 'name: wrong-name'));
  let result = check(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid metadata: hownter-architecture/);

  await writeFile(filename, `${original}\r\n[Missing resource](missing.md)\r\n`);
  result = check(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ENOENT|Broken reference/);
});
