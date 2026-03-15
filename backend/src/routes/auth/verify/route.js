import { cookies } from "#root/shims/nextHeaders.js";
import connectDB from "#root/lib/mongoose.js";
import User from "#root/models/User.js";
import Investor from "#root/models/Investor.js";
import Founder from "#root/models/Founder.js";
import { signAuthToken } from "#root/lib/auth/jwt.js";
import {
  getExpiredCookieOptions,
  getTokenCookieOptions,
} from "#root/lib/auth/cookieOptions.js";
import { ok, fail } from "#root/lib/response.js";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { otp, email: emailInBody } = body;

    if (!otp) {
      return fail("OTP is required", 400);
    }

    const cookieStore = await cookies();
    const email = (emailInBody || cookieStore.get("pending_email")?.value || "").toLowerCase();

    if (!email) {
      return fail("Email context missing. Please start over.", 400);
    }

    await connectDB();
    const user = await User.findOne({ email });

    if (!user || !user.otp || !user.otpExpiry) {
      return fail("OTP not generated. Please sign up again.", 400);
    }

    if (user.otp !== otp) {
      return fail("Invalid OTP", 401);
    }

    if (new Date(user.otpExpiry) < new Date()) {
      return fail("OTP expired", 401);
    }

    await User.updateOne(
      { email },
      {
        $set: { status: "verified", updatedAt: new Date() },
        $unset: { otp: "", otpExpiry: "" },
      },
    );

    const verifiedUser = await User.findOne({ email });
    if (!verifiedUser?._id) {
      return fail("User not found after verification", 500);
    }

    if (verifiedUser.role === "investor") {
      await Investor.updateOne(
        { userId: verifiedUser._id },
        { $setOnInsert: { userId: verifiedUser._id } },
        { upsert: true },
      );
    } else if (verifiedUser.role === "founder") {
      await Founder.updateOne(
        { userId: verifiedUser._id },
        { $setOnInsert: { userId: verifiedUser._id } },
        { upsert: true },
      );
    }

    const token = signAuthToken(verifiedUser, { expiresIn: "15m" });

    cookieStore.set("token", token, getTokenCookieOptions(15 * 60));
    cookieStore.set("pending_email", "", getExpiredCookieOptions());

    return ok({ token, verified: true });
  } catch (error) {
    console.error("POST /api/auth/verify error:", error);
    return fail("Internal server error", 500);
  }
}
