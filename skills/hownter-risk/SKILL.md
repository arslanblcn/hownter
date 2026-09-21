---
name: hownter-risk
description: Assess PAM threat risk and plan mitigations. Use to evaluate controls, prioritize findings, and define verification acceptance criteria.
---

# Assess risk and plan controls

Read [the shared contract and risk rubric](../hownter-threat-model/references/methodology.md)
and [the field contract](../hownter-threat-model/assets/assessment.schema.json).
Input: architecture, threat scenarios, organization risk rubric if available and control evidence.

1. Assess inherent risk from scenario prerequisites and privileged impact; explain uncertainty.
2. Distinguish unverified, verified and failed controls. Only mark verified with actual test/inspection evidence.
3. Assess residual risk without crediting unsupported controls; use unknown when needed.
4. Assign a documented disposition and owner role; use unknown when an actual owner is unavailable.
5. Propose preventive, detective and recovery changes with specific acceptance criteria and safe test steps.
6. Keep implementation status and model coverage separate. Require actual human evidence for risk acceptance
or dismissal; do not let the agent make organizational risk decisions.

Output: complete threat records plus risk and verification sections of each module model.
Complete when every applicable threat has a rationale, disposition, owner, mitigation and verification plan.
A plan is not an executed test. Unavailable verification leaves controls unverified.
Example: "Use hownter-risk to prioritize vault extraction paths and define testable mitigations."
