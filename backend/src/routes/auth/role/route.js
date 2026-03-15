import { cookies } from "#root/shims/nextHeaders.js";
import connectDB from "#root/lib/mongoose.js";
import User from "#root/models/User.js";
import Investor from "#root/models/Investor.js";
import Founder from "#root/models/Founder.js";
import { getAuthContext } from "#root/lib/auth/authUtils.js";
import { signAuthToken } from "#root/lib/auth/jwt.js";
import { getTokenCookieOptions } from "#root/lib/auth/cookieOptions.js";
import { ok, fail } from "#root/lib/response.js";
import { toObjectId } from "#root/lib/security/objectId.js";

const ROLE_REDIRECTS = {
  INVESTOR: "/onboarding/investor",
  FOUNDER: "/onboarding/founder",
  FUND_MANAGER: "/dashboard/fundmanager",
};

function toDbRole(role) {
  const normalized = String(role || "").toUpperCase();
  if (normalized === "INVESTOR") return "investor";
  if (normalized === "FOUNDER") return "founder";
  if (normalized === "FUND_MANAGER") return "fund_manager";
  return null;
}

export async function POST(req) {
  try {
    const { role } = await req.json();
    const dbRole = toDbRole(role);
    if (!dbRole) {
      return fail("Invalid role", 400);
    }

    const { user, userId } = await getAuthContext(req);
    if (!user || !userId) {
      return fail("Not authenticated", 401);
    }

    await connectDB();
    await User.updateOne(
      { _id: toObjectId(userId) },
      { $set: { role: dbRole, updatedAt: new Date() } },
    );

    const updated = await User.findById(userId);
    if (!updated?._id) {
      return fail("User not found", 404);
    }

    if (dbRole === "investor") {
      await Investor.updateOne(
        { userId: updated._id },
        { $setOnInsert: { userId: updated._id } },
        { upsert: true },
      );
    } else if (dbRole === "founder") {
      await Founder.updateOne(
        { userId: updated._id },
        { $setOnInsert: { userId: updated._id } },
        { upsert: true },
      );
    }

    const token = signAuthToken(updated);
    (await cookies()).set("token", token, getTokenCookieOptions(60 * 60 * 24 * 7));

    return ok({ token, redirect: ROLE_REDIRECTS[String(role).toUpperCase()] || "/dashboard" });
  } catch (error) {
    console.error("POST /api/auth/role error:", error);
    return fail("Internal server error", 500);
  }
}
