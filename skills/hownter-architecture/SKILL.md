---
name: hownter-architecture
description: Model PAM architecture, data flows and trust boundaries. Use before identifying threats or after material architecture changes.
---

# Model architecture and trust

Read [the shared contract](../hownter-threat-model/references/methodology.md) and
[the model template](../hownter-threat-model/assets/model.template.md).
Input: module inventory, source revision, relevant code/configuration and documentation.

1. Identify actors, assets, processes, stores, service identities and administrative paths.
2. Assign stable flow and boundary IDs; distinguish control plane, data plane, tenant, host and network trust.
3. Trace secret creation, storage, retrieval, use, rotation, revocation and deletion where applicable.
4. Record protocol, identity, authorization point, sensitive payload and failure behavior for each flow.
5. Draw a Mermaid data-flow diagram using the IDs; include external integrations and connected modules.
6. Separate documented architecture from observed implementation. Record deployment-specific assumptions.

Output: module Markdown model and scope/architecture completion evidence in assessment.json.
Complete only when sensitive flows and policy decisions have traceable sources. If code is missing,
label the model partial and identify required artifacts; do not invent a protocol or encryption scheme.
Example: "Use hownter-architecture to trace credential checkout across API, vault and session broker."
