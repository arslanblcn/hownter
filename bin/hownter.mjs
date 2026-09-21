#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { install, skillNames, skillsRoot, assertSafePath } from '../lib/install.mjs';
import { runAssessment } from '../skills/hownter-threat-model/scripts/assessment.mjs';

const help = `Hownter — PAM threat modeling skills (Node.js 22+)

  hownter install [--agent codex|claude|cursor] [--global] [--cwd PATH]
                  [--dry-run] [--force]
  hownter list
  hownter init [--cwd PATH]
  hownter validate <assessment.json>
  hownter coverage <assessment.json> [--min-coverage 0..100]
  hownter --help | --version

Default: project installation for Codex (.agents/skills).
--force preserves replaced skill directories in .hownter-backups.
init creates security/threat-models/assessment.json with a provisional inventory.
No LLM calls, telemetry, API keys, or automatic security tests.
Install for one agent per workspace to avoid duplicate skill discovery in Cursor.
`;

try {
  const { values: opts, positionals } = parseArgs({ options: {
    agent: { type: 'string' }, global: { type: 'boolean' }, cwd: { type: 'string' },
    'dry-run': { type: 'boolean' }, force: { type: 'boolean' },
    'min-coverage': { type: 'string' }, help: { type: 'boolean', short: 'h' }, version: { type: 'boolean', short: 'v' }
  }, allowPositionals: true, strict: true });
  const [command, file, ...rest] = positionals;
  if (opts.help || (!command && !opts.version)) console.log(help);
  else if (opts.version) console.log(JSON.parse(await readFile(new URL('../package.json', import.meta.url))).version);
  else {
    const allowed = { install: ['agent', 'global', 'cwd', 'dry-run', 'force'], list: [], init: ['cwd'], validate: [], coverage: ['min-coverage'] };
    if (!Object.hasOwn(allowed, command)) throw new Error(`Unknown command: ${command}`);
    for (const key of Object.keys(opts)) if (!allowed[command].includes(key)) throw new Error(`--${key} is not valid for ${command}`);
    if (rest.length || (file && !['validate', 'coverage'].includes(command))) throw new Error('Unexpected positional argument');
    if (command === 'install') {
      const result = await install({ agent: opts.agent, cwd: opts.cwd, global: opts.global, dryRun: opts['dry-run'], force: opts.force });
      for (const row of result) console.log(`${opts['dry-run'] ? '[dry-run] ' : ''}${row.action}: ${row.destination}${row.backup ? ` (backup: ${row.backup})` : ''}`);
      console.log('Ask your agent: Use hownter-threat-model to assess this PAM repository.');
    } else if (command === 'list') console.log((await skillNames()).join('\n'));
    else if (command === 'init') {
      const dest = path.resolve(opts.cwd ?? process.cwd(), 'security/threat-models/assessment.json');
      await assertSafePath(dest);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, await readFile(path.join(skillsRoot, 'hownter-threat-model/assets/assessment.template.json')), { flag: 'wx' });
      console.log(`Created ${dest}. Inventory is provisional; no product has been assessed.`);
    } else {
      process.exitCode = await runAssessment(command, file, opts['min-coverage'] === undefined ? undefined : Number(opts['min-coverage']));
    }
  }
} catch (e) { console.error(`Hownter: ${e.message}`); process.exitCode = 1; }
