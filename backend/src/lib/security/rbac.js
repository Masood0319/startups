import { getAuthContext } from "#root/lib/auth/authUtils.js";
import { fail } from "#root/lib/response.js";

export async function requireAuthGuard(req) {
  const { user, userId, tokenRole } = await getAuthContext(req);
  if (!user || !userId || !tokenRole) {
    return { ok: false, response: fail("Authentication required", 401) };
  }

  return { ok: true, user, userId, tokenRole };
}

export async function requireRole(req, allowedRoles = []) {
  const auth = await requireAuthGuard(req);
  if (!auth.ok) return auth;

  const normalizedAllowed = allowedRoles.map((r) => String(r).toUpperCase());
  if (!normalizedAllowed.includes(String(auth.tokenRole).toUpperCase())) {
    return { ok: false, response: fail("Forbidden", 403) };
  }

  return auth;
}
