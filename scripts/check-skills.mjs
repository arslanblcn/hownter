import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../skills/', import.meta.url)));
const dirs = await readdir(root);
if (dirs.length !== 7) throw new Error('Expected seven bundled skills');
for (const name of dirs) {
  const filename = path.join(root, name, 'SKILL.md');
  const text = await readFile(filename, 'utf8');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) throw new Error(`Invalid skill name: ${name}`);
  if (!text.startsWith(`---\nname: ${name}\ndescription: `) || !/^description: .{20,1024}$/m.test(text)) throw new Error(`Invalid metadata: ${name}`);
  if (text.split('\n').length > 500) throw new Error(`Skill too long: ${name}`);
  for (const [, target] of text.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^https?:/.test(target)) continue;
    const resolved = path.resolve(path.dirname(filename), target.split('#')[0]);
    if (!resolved.startsWith(root + path.sep) && resolved !== root) throw new Error(`Reference escapes skills: ${target}`);
    if (!(await stat(resolved)).isFile()) throw new Error(`Broken reference: ${name} -> ${target}`);
  }
}
console.log(`Validated ${dirs.length} skill metadata files and direct resource links.`);
