---
name: hownter-review
description: Review the completeness and evidence of PAM threat models. Use before requesting human approval or reassessing a changed module.
---

# Review and validate

Read [the shared contract](../hownter-threat-model/references/methodology.md) and
[the assessment schema](../hownter-threat-model/assets/assessment.schema.json).
Input: inventory, models, threat records, evidence and source revision.

1. Reconcile critical inventory against models, including shared infrastructure and connected flows.
2. Inspect completion-gate evidence and threat-to-flow/boundary links; question unsupported safety claims.
3. Check risk dispositions, unknown owners, control evidence, acceptance criteria and cross-module chains.
4. Run the bundled assessment validator; resolve structural problems without fabricating content.
5. Set ready models pending_review. Provide a short reviewer checklist and unresolved high-risk items.
6. Only record a human review after receiving its reviewer identity, date and actual review evidence.
Record covered only after all seven gates are substantiated, inventory reconciled and freshness assessed.

Output: corrected assessment, reviewer action list and honest status. AI self-review is not human approval.
If review evidence is inaccessible or ambiguous, retain pending_review and state what must be confirmed.
Example: "Use hownter-review to prepare the broker threat model for security-owner approval."
