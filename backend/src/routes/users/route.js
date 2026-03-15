import { getAuthContext } from "#root/lib/auth/authUtils.js";
import { ok, fail } from "#root/lib/response.js";

export async function GET(req) {
  try {
    const { user } = await getAuthContext(req);
    if (!user) return fail("Unauthorized", 401);

    return ok({ user });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return fail("Internal server error", 500);
  }
}
