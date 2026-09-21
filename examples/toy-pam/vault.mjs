// Synthetic teaching fixture. Not production software; do not deploy.
export function readCredential(principal, tenantId, credentialId, store) {
  if (!principal.scopes.includes('vault:read')) throw new Error('Forbidden');
  return store.get(`${tenantId}/${credentialId}`);
}
