# Threat model: <module ID> — <name>

Status: in_progress | Source revision: <commit> | Inventory version: <version>
Owner: <role or unknown> | Assessment date: <YYYY-MM-DD>

## Scope and objectives
State privileged assets, supported deployments, scope exclusions and justification.

## Evidence and uncertainty
List path + line range + revision, document versions, inferred facts and unanswered questions.
Do not paste secrets. Distinguish a design threat from an observed vulnerability.

## Architecture
List actors, processes, stores, flow IDs, boundary IDs, authentication and authorization decisions.
Include a Mermaid data-flow diagram using the same stable IDs as the threat records.

## Threat assessment
For each applicable flow/boundary, record STRIDE scenarios and PAM abuse cases.
Explain not-applicable decisions and no-threat conclusions. Link structured threat IDs.

## Cross-module attack paths
Trace a foothold through connected modules to a privileged asset. Note external dependencies.

## Controls and residual risk
Separate documented, observed and tested controls; apply the agreed risk rubric.
Record risk disposition, owner and rationale for each threat, including accepted or dismissed ones.

## Mitigation and verification plan
State specific changes, acceptance criteria, safe verification steps and owner roles.
Separate proposed tests from executed tests and retain results for executed checks.

## Review and freshness
Leave human approval empty until independently provided; cite the actual review record.
Record changed paths, affected flows, source revisions and change-impact reasoning.

## AI-assisted execution
Record agent, model if known, run reference, input revision and limitations; no hidden reasoning.
