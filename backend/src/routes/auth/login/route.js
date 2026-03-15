import bcrypt from "bcryptjs";
import { cookies } from "#root/shims/nextHeaders.js";
import connectDB from "#root/lib/mongoose.js";
import User from "#root/models/User.js";
import { signAuthToken } from "#root/lib/auth/jwt.js";
import { getTokenCookieOptions } from "#root/lib/auth/cookieOptions.js";
import { ok, fail } from "#root/lib/response.js";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return fail("Email and password are required", 400);
    }

    await connectDB();
    const user = await User.findOne({ email: String(email).toLowerCase() });

    if (!user) {
      return fail("Invalid credentials", 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return fail("Invalid credentials", 401);
    }

    const token = signAuthToken(user);

    const cookieStore = await cookies();
    cookieStore.set("token", token, getTokenCookieOptions(60 * 60 * 24 * 7));

    return ok({
      user: {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
        fullName: user.full_name,
      },
    });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return fail("Internal server error", 500);
  }
}
