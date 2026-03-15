import bcrypt from "bcrypt";
import { cookies } from "#root/shims/nextHeaders.js";
import connectDB from "#root/lib/mongoose.js";
import User from "#root/models/User.js";
import { getAuthContext } from "#root/lib/auth/authUtils.js";
import { signAuthToken } from "#root/lib/auth/jwt.js";
import { getTokenCookieOptions } from "#root/lib/auth/cookieOptions.js";
import { ok, fail } from "#root/lib/response.js";
import { toObjectId } from "#root/lib/security/objectId.js";

export async function POST(req) {
  try {
    const { password } = await req.json();

    if (!password || password.length < 6) {
      return fail("Password must be at least 6 characters", 400);
    }

    const { user, userId } = await getAuthContext(req);
    if (!user || !userId) {
      return fail("Not authorized for setup", 401);
    }

    if (user.status !== "verified") {
      return fail("User must be verified first", 400);
    }

    await connectDB();
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.updateOne(
      { _id: toObjectId(userId) },
      { $set: { password: hashedPassword, updatedAt: new Date() } },
    );

    const freshUser = await User.findById(userId);
    if (!freshUser?._id) {
      return fail("User not found", 404);
    }

    const token = signAuthToken(freshUser, { expiresIn: "7d" });

    const cookieStore = await cookies();
    cookieStore.set("token", token, getTokenCookieOptions(60 * 60 * 24 * 7));

    return ok({ token, setupComplete: true });
  } catch (error) {
    console.error("POST /api/auth/setup error:", error);
    return fail("Internal server error", 500);
  }
}
