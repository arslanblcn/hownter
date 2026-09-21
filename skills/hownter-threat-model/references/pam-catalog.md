# PAM threat discovery catalog

Candidate areas are hypotheses until verified against the product inventory. For every applicable
scenario trace prerequisites, flow, boundary, existing control evidence, impact and a safe test plan.

| Area | Abuse scenario | Evidence to inspect | Verification question |
| --- | --- | --- | --- |
| Authentication | MFA recovery or federation bypass | token validation, recovery handlers, issuer configuration | Can an alternative path obtain equivalent privilege without equivalent assurance? |
| Authorization | role escalation, IDOR, confused deputy | policy calls, object ownership checks, service identity scopes | Is policy checked on each privileged operation with the correct subject and resource? |
| Tenant isolation | cross-tenant secrets or sessions | tenant resolution, queries, cache keys, storage paths | Does every data path bind tenant context server-side? |
| Vault and keys | extraction, overly broad decryption | encryption boundary, KMS policy, memory/log handling | Can one compromised identity decrypt unrelated secrets? |
| Rotation | old credential survives partial failure | state machine, retry logic, reconciliation | What happens when target rotation succeeds but vault update fails, or vice versa? |
| JIT and approvals | self-approval, replay, time-of-check bypass | approval binding, TTL, revocation | Are approvals bound to exact target, privilege, duration and requester? |
| Sessions | hijack, command bypass, orphaned access | broker auth, proxy state, termination handlers | Does expiry or revocation terminate every active privileged path? |
| Recordings | tamper or sensitive-data disclosure | recording authorization, integrity and retention | Can an operator alter evidence or read another tenant's recording? |
| Connectors/agents | remote execution and lateral movement | enrollment, command signing, network reach | Can a compromised connector impersonate peers or expand targets? |
| Audit | suppression, forgery, gaps | event producers, queues, failure behavior | Can privileged work proceed invisibly during logging failure? |
| Emergency access | permanent bypass or untracked privilege | break-glass provisioning, expiry, notifications | Is emergency use scoped, observable and subsequently reviewed? |
| Backup/restore | secret leakage or resurrected privilege | backup keys, restore authorization, state consistency | Can restore re-enable revoked identities or stale credentials? |
| Deployment/update | malicious update or control-plane takeover | CI trust, signing, dependencies, deployment identity | Does update trust extend beyond the intended publisher and scope? |
| Availability | revocation or access outage | failover, quotas, circuit breakers, dependencies | Do partial failures fail open or block critical recovery? |

For cross-module paths consider: compromised connector -> service token -> vault -> privileged session;
approval replay -> JIT grant -> session persistence after expiry; backup restore -> revoked account
resurrection -> audit gap. Use only paths supported or explicitly hypothesized for the assessed product.

If the product actually includes AI, additionally inspect prompt/data trust, tool permissions and
sensitive output handling. AI-assisted assessment alone does not imply an AI product attack surface.
