---
name: hownter-discover
description: Discover PAM modules and justify criticality. Use when establishing a threat-model inventory or checking new modules and scope changes.
---

# Discover and classify modules

Read [the shared contract](../hownter-threat-model/references/methodology.md) and
[the PAM catalog](../hownter-threat-model/references/pam-catalog.md).
Input: repository revision, deployment scope and available architecture/owner documents.

1. Enumerate services, packages, API routes, background jobs, agents, connectors and infrastructure.
2. Reconcile code with deployment manifests and documents; document mismatches and inaccessible components.
3. Create inventory.modules entries with stable IDs, owner, responsibility, source paths, privileged assets,
entry points, dependency module IDs, evidence and open questions. Dependencies outside the inventory
must be described in the Markdown model instead of invented module IDs.
4. Mark critical when compromise can expose privileged credentials, grant or persist privileged access,
bypass tenant/policy boundaries, control updates, suppress accountability or disable vital recovery.
Explain every classification including noncritical decisions. Include critical shared infrastructure.
5. Keep inventory status provisional and approval null until the owner confirms completeness and scope.
Increment inventory.version after material changes and reconcile models; never narrow scope silently.

Output: updated assessment.json inventory plus a concise scope/unknowns summary.
Complete when each discovered module has a defensible classification and evidence; owner approval is a
separate checkpoint. Missing access produces a recorded gap, not an assumption that no module exists.
Example: "Use hownter-discover to inventory the vault, broker and connector services."
