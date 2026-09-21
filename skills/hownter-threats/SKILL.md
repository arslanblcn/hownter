---
name: hownter-threats
description: Identify PAM threats using STRIDE and abuse cases. Use for trust-boundary analysis, privileged workflows, and cross-module attack paths.
---

# Identify threats and attack paths

Read [the shared contract](../hownter-threat-model/references/methodology.md),
[the PAM catalog](../hownter-threat-model/references/pam-catalog.md), and
[the threat record schema](../hownter-threat-model/assets/assessment.schema.json).
Input: architecture with stable flow/boundary IDs and source evidence.

1. Evaluate relevant STRIDE categories for each sensitive flow and boundary; justify non-applicable cases.
2. Cover privileged insiders, compromised identities/connectors, unauthenticated actors and supply-chain paths
as applicable. Include business-logic failures, race conditions and partial-failure behavior.
3. Write concrete scenarios: actor + prerequisite + action + boundary failure + privileged impact.
4. Trace cross-module chains; deduplicate shared threats while linking every affected module in the models.
5. Create stable threat IDs, attach source evidence and label observed/inferred/hypothetical with confidence.
6. Record controls without claiming effectiveness. Carry unresolved questions into risk assessment.

Output: structured threat records and Markdown threat/cross-module sections. Hand provisional records
to hownter-risk to complete mandatory risk/disposition fields before final validation.
Complete when applicable flows are evaluated with evidence, including justified no-threat conclusions.
Do not mistake generic vulnerability lists or scanner findings for architecture analysis.
Example: "Use hownter-threats to assess approval replay and sessions surviving JIT access expiry."
