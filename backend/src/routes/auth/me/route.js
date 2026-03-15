import { getAuthContext } from "#root/lib/auth/authUtils.js";
import { ok, fail } from "#root/lib/response.js";

export async function GET(req) {
  try {
    const { user, userId } = await getAuthContext(req);
    if (!user || !userId) {
      return fail("Unauthorized", 401);
    }

    return ok({
      authenticated: true,
      user: {
        id: userId,
        userId,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        full_name: user.full_name,
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return fail("Internal server error", 500);
  }
}
