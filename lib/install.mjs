import { lstat, readdir, readFile, mkdir, cp, rename, rm, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

export const skillsRoot = fileURLToPath(new URL('../skills/', import.meta.url));
export const targets = { claude: '.claude/skills', cursor: '.cursor/skills', codex: '.agents/skills' };
export async function skillNames() {
  return (await readdir(skillsRoot, { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name).sort();
}
async function stat(p) {
  try { return await lstat(p); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
// Reject symlinks in destination ancestors, including dangling links. Never follow
// an existing skill tree while replacing it. This is not a hostile-process sandbox.
export async function assertSafePath(p) {
  const resolved = path.resolve(p);
  let current = path.parse(resolved).root;
  for (const part of resolved.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    const info = await stat(current);
    if (info?.isSymbolicLink()) throw new Error(`Refusing symlink: ${current}`);
  }
}
async function snapshot(dir, prefix = '') {
  const result = {};
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = path.join(prefix, entry.name);
    const absolute = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing symlink: ${absolute}`);
    if (entry.isDirectory()) Object.assign(result, await snapshot(absolute, rel));
    else if (entry.isFile()) result[rel] = (await readFile(absolute)).toString('base64');
    else throw new Error(`Unsupported file type: ${absolute}`);
  }
  return result;
}
function equal(a, b) {
  return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => a[k] === b[k]);
}
export async function install({ agent = 'codex', cwd = process.cwd(), global = false, home = os.homedir(), dryRun = false, force = false } = {}) {
  if (!Object.hasOwn(targets, agent)) throw new Error(`Unknown agent ${agent}; use claude, cursor, or codex`);
  const base = path.resolve(global ? home : cwd);
  const root = path.join(base, targets[agent]);
  await assertSafePath(root);
  const plan = [];
  for (const name of await skillNames()) {
    const source = path.join(skillsRoot, name);
    const destination = path.join(root, name);
    await assertSafePath(destination);
    const info = await stat(destination);
    if (info && !info.isDirectory()) throw new Error(`Not a skill directory: ${destination}`);
    const same = info && equal(await snapshot(source), await snapshot(destination));
    if (info && !same && !force) throw new Error(`Existing files differ: ${destination}. Review them, then use --force to back up and replace.`);
    plan.push({ name, source, destination, action: same ? 'unchanged' : info ? 'replace' : 'install' });
  }
  if (dryRun) return plan;
  await mkdir(root, { recursive: true });
  for (const item of plan) {
    if (item.action === 'unchanged') continue;
    // Stage the complete skill before touching any prior installation.
    const stage = await mkdtemp(path.join(base, '.hownter-stage-'));
    let backup;
    try {
      await cp(item.source, path.join(stage, item.name), { recursive: true, errorOnExist: true });
      if (item.action === 'replace') {
        const backupRoot = path.join(base, '.hownter-backups');
        await assertSafePath(backupRoot);
        await mkdir(backupRoot, { recursive: true });
        const backupDir = await mkdtemp(path.join(backupRoot, `${item.name}-`));
        backup = path.join(backupDir, item.name);
        await rename(item.destination, backup);
        item.backup = backup;
      }
      await rename(path.join(stage, item.name), item.destination);
    } catch (error) {
      if (backup && !(await stat(item.destination))) await rename(backup, item.destination);
      throw error;
    } finally { await rm(stage, { recursive: true, force: true }); }
  }
  return plan;
}
