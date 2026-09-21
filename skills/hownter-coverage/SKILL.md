---
name: hownter-coverage
description: Calculate PAM threat-model coverage and assess staleness. Use for OKR reporting, CI checks and change-impact analysis.
---

# Report coverage and change impact

Read [the shared contract](../hownter-threat-model/references/methodology.md).
Input: assessment.json, approved inventory and trusted current revision. For incremental work also read
changed paths, dependency changes, configuration/deployment changes and previous model revisions.

1. Discover additions before calculating the denominator. Never build inventory only from existing models.
2. Map changes to affected modules and connected flows, including auth, policy, secrets, API and deployment.
3. Set freshness checked_revision to the actual target revision. Use affected/unknown and status stale when
reassessment is needed; document an unaffected decision only after inspecting the complete change range.
4. Reassess affected modules and obtain a new human review; do not reuse superseded approval.
5. Run `node <sibling-hownter-threat-model>/scripts/assessment.mjs coverage <assessment.json>`.
Use `--min-coverage 100` only when a failing process-coverage gate is intended.
6. Report numerator/denominator, percentage or unverified reason, per-module blockers and missing modules.
Report unresolved high/critical/unknown risk and mitigated threat count separately.

Output: JSON coverage report and a concise Markdown OKR summary. Synthetic fixtures are never counted.
The tool checks recorded freshness and references; it does not inspect git or authenticate approvals.
The agent must supply truthful evidence and current revision. Use repository protections for trusted CI.
Complete when a rerun yields the same result for the same assessment and every excluded model has a reason.
Example: "Use hownter-coverage to assess the auth-policy diff and report critical-module coverage."
