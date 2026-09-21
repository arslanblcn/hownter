# Hownter

**Evidence-based threat modeling skills for Privileged Access Management products.**

Install seven English-language skills into your coding agent with `npx`. Let your agent
inspect your repository, model privileged workflows, assess threats, and produce reviewable
artifacts. Hownter's deterministic tooling validates those artifacts and calculates module coverage.

No runtime dependencies, telemetry, LLM API calls, credentials, or install lifecycle scripts.
The installer adds instructions and tools to your agent; it does not train a model or run an
autonomous security assessment. Your existing agent supplies the LLM and repository access.

## Install

Requires **Node.js 22+**, npm, and Git for the GitHub package specifier. Run from the repository
you want to assess. GitHub distribution works without an npm registry release:

```sh
# Claude Code
npx --yes github:arslanblcn/hownter install --agent claude

# Cursor
npx --yes github:arslanblcn/hownter install --agent cursor

# Codex
npx --yes github:arslanblcn/hownter install --agent codex
```

Choose one target per workspace. Cursor also discovers compatible Claude/Codex skill locations;
installing duplicate copies for multiple agents may show duplicate skills.

| Target | Project location | Global location (`--global`) |
| --- | --- | --- |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| Cursor | `.cursor/skills/` | `~/.cursor/skills/` |
| Codex | `.agents/skills/` | `~/.agents/skills/` |

```sh
# Preview without writing
npx --yes github:arslanblcn/hownter install --agent claude --dry-run

# Available across local projects
npx --yes github:arslanblcn/hownter install --agent claude --global

# Install into an explicit project
npx --yes github:arslanblcn/hownter install --agent cursor --cwd ./my-pam
```

Local filesystem installation does not automatically configure hosted chat applications or remote
agent workers. Commit project skills or use the host's supported distribution mechanism.

### Updates and reproducibility

Re-running an identical installation changes nothing. Different existing files cause a conflict
before any skill is changed. After reviewing differences, pass `--force` to replace them; old skill
directories are retained under `.hownter-backups/` in the selected project or home directory.
Backups stay outside skill discovery paths. Unexpected symlinks are rejected.

For repeatable team installs, pin the GitHub specifier to a reviewed commit:

```sh
npx --yes "github:arslanblcn/hownter#<full-commit-sha>" install --agent claude
```

The unpinned GitHub command follows the default branch, subject to npm caching. Use a new exact
commit specifier to select an update reliably. Only execute packages from a source you trust.

## Start an assessment

In your coding agent, ask:

> Use hownter-threat-model to assess this PAM repository at the current revision. Discover critical
> modules, trace privileged data flows and trust boundaries, evaluate threats, and write evidence-backed
> outputs to security/threat-models. Keep the inventory provisional and models pending review until
> their designated human owners approve them. Report coverage and unresolved risks separately.

In Claude Code you can also invoke `/hownter-threat-model`. In Codex, select the skill or mention
`$hownter-threat-model`. Use the skill picker in Cursor. Refresh the host's skill list if necessary.

Optionally initialize the assessment file first:

```sh
npx --yes github:arslanblcn/hownter init
npx --yes github:arslanblcn/hownter validate security/threat-models/assessment.json
npx --yes github:arslanblcn/hownter coverage security/threat-models/assessment.json
```

`init` refuses to overwrite an existing file. The initial inventory is empty and provisional;
it deliberately has no verified coverage percentage.

## Included skills

| Skill | Purpose |
| --- | --- |
| `hownter-threat-model` | Orchestrates the workflow and owns shared references, templates and tooling |
| `hownter-discover` | Inventories modules and justifies criticality |
| `hownter-architecture` | Models assets, flows, identities and trust boundaries |
| `hownter-threats` | Applies STRIDE and PAM abuse cases; traces cross-module paths |
| `hownter-risk` | Assesses controls and risk; plans mitigations and verification |
| `hownter-review` | Checks evidence and prepares human review |
| `hownter-coverage` | Calculates coverage and guides change-impact reassessment |

All seven are installed together. Specialist skills reference resources in the sibling orchestrator
directory. Preserve this layout if copying the skills manually.

## What 100% means

**Coverage = covered critical modules / all critical modules in the approved inventory × 100.**

A covered module has evidence for scope, architecture, threats, controls, risk, verification planning,
and cross-module assessment; recorded human approval; AI-assistance provenance; and an assessment
that remains applicable to the current revision and inventory version.

- Missing, blocked, incomplete, unreviewed and stale models do not count.
- Synthetic assessments never produce real product coverage.
- A provisional inventory, unresolved current revision or zero critical modules yields `null` coverage.
- A changed revision requires documented change-impact analysis. Unaffected models can remain current.
- Mitigation implementation and unresolved high/critical/unknown risk are separate outputs.

100% process coverage does **not** mean all vulnerabilities are discovered or all risks are resolved.

The validator verifies the schema, references between records, required evidence fields and coverage
rules. It cannot authenticate a reviewer, establish inventory completeness, inspect the current Git
revision, verify referenced documents exist, or prove a control works. Use real evidence, human review
and protected assessment changes. Do not treat editable JSON fields as an independent attestation.

### CI gate

```sh
npx --yes "github:arslanblcn/hownter#<reviewed-commit-sha>" coverage \
  security/threat-models/assessment.json --min-coverage 100
```

Exit codes: `0` valid report/threshold met; `1` malformed data, inconsistent claims or CLI error;
`2` valid data but coverage unverified or below threshold. Reporting without a threshold can exit
successfully with `percentage: null`; inspect `verified` before presenting an OKR percentage.

For an offline check after installing skills, run the bundled tool directly:

```sh
node .claude/skills/hownter-threat-model/scripts/assessment.mjs \
  coverage security/threat-models/assessment.json --min-coverage 100
```

The agent performs source discovery and change-impact analysis; the CLI does not automatically
recalculate freshness from Git. Supply the true current revision before running a gate. Protect
inventory, approvals, freshness decisions and CI configuration with normal review controls.

## Artifacts and example

The canonical contract is
[`assessment.schema.json`](skills/hownter-threat-model/assets/assessment.schema.json).
It combines inventory, model lifecycle, completion gates, threat records, approvals and provenance.
The bundled zero-dependency validator supports exactly the JSON Schema keywords used by this schema;
it is not a general-purpose schema library.

Use the [Markdown model template](skills/hownter-threat-model/assets/model.template.md) alongside JSON.
Evidence should include source revision and path/symbol or a versioned document reference. Do not
copy secrets, tokens, private keys or real privileged credentials into outputs.

[`examples/`](examples/) contains a deliberately synthetic vault, a worked threat model and a
pending-review assessment. It illustrates an inferred cross-tenant path without claiming a proven
production vulnerability. Run it after cloning:

```sh
node bin/hownter.mjs validate examples/assessment.synthetic.json
node bin/hownter.mjs coverage examples/assessment.synthetic.json
```

## Development

```sh
npm run check
npm test
npm pack
npx --yes --offline --package=./arslanblcn-hownter-0.1.0.tgz hownter list
```

Tests cover installation, dry runs, conflicts/backups, symlink rejection, portable installed scripts,
schema errors and coverage accounting. CI runs on Linux, macOS and Windows with Node 22 and 24.
No dependency install is needed for development. `npm pack` runs the skill checks before packaging.

### Optional npm publication

This repository is ready for a scoped npm release as `@arslanblcn/hownter`. A maintainer with access
to that npm scope can run `npm publish --access public` after validation. The scope's availability and
ownership must be checked in the maintainer's npm account. No npm release is performed by this project.

Only **after publication** will this registry command work:

```sh
npx --yes @arslanblcn/hownter install --agent claude
```

## References

- [OWASP threat modeling](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)
- [Claude Code skills](https://code.claude.com/docs/en/skills)
- [Cursor skills](https://cursor.com/docs/skills)
- [Codex skills](https://developers.openai.com/codex/skills)
- [npm exec and npx](https://docs.npmjs.com/cli/npm-exec/)

## License

MIT. See [LICENSE](LICENSE).
