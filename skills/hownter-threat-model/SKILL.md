---
name: hownter-threat-model
description: Run an evidence-based end-to-end PAM threat model. Use for privileged access management security assessments, baseline modeling, or coordinating module coverage.
---

# PAM threat modeling orchestrator

Read [methodology](references/methodology.md), [PAM catalog](references/pam-catalog.md), and the
[JSON contract](assets/assessment.schema.json) before starting. Use [the assessment seed](assets/assessment.template.json)
and [the model template](assets/model.template.md). Require an authorized repository or architecture input;
when none exists, produce an explicit missing-input list or labeled synthetic demonstration, not product findings.

1. Read trusted workspace instructions. Record repository revision, deployment scope and output directory.
2. Load sibling `hownter-discover/SKILL.md`; establish a provisional inventory and request owner confirmation.
3. For each critical module load `hownter-architecture/SKILL.md`, then `hownter-threats/SKILL.md`.
4. Load `hownter-risk/SKILL.md` and produce risk dispositions and verification plans.
5. Load `hownter-review/SKILL.md`. Leave approval null until supplied by a designated human.
6. Load `hownter-coverage/SKILL.md`; validate the complete assessment and report gaps.
7. Finish with outputs, critical coverage, open risk, blockers, reviewer actions and next owners.

Execute stages sequentially unless the user authorizes delegation. Do not treat specialist skills as
separate models or automatically spawn agents. Persist progress so interrupted runs can resume.
For incremental work discover new modules first, then compare revisions and revisit affected flows.
Do not stop all analysis for one blocked module; record it and assess accessible modules.

Run the bundled tool without downloading a package:
`node <this-skill-directory>/scripts/assessment.mjs validate <assessment.json>`
`node <this-skill-directory>/scripts/assessment.mjs coverage <assessment.json> --min-coverage 100`

Completion: all accessible modules assessed, gaps explicit, structured output valid, approvals authentic,
and coverage reported without inventing missing evidence. An actual product may remain below 100%.
Example: "Use hownter-threat-model to baseline this PAM repository at HEAD; write to security/threat-models."
