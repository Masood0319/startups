import { cookies } from "#root/shims/nextHeaders.js";
import { NextResponse } from "#root/shims/nextServer.js";
import sendEmail from "#root/utils/sendEmail.js";
import connectDB from "#root/lib/mongoose.js";
import User from "#root/models/User.js";
import { signAuthToken } from "#root/lib/auth/jwt.js";
import {
  getPendingEmailCookieOptions,
  getTokenCookieOptions,
} from "#root/lib/auth/cookieOptions.js";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizeDbRole(inputRole) {
  const normalized = String(inputRole || "").trim().toUpperCase();
  if (normalized === "FOUNDER") return "founder";
  if (normalized === "INVESTOR") return "investor";
  if (normalized === "FUND_MANAGER") return "fund_manager";
  return null;
}

export async function POST(req) {
  try {
    const { email, role } = await req.json();

    if (!email || !String(email).includes("@")) {
      return NextResponse.json(
        { success: false, message: "Valid email is required" },
        { status: 400 },
      );
    }

    const normalizedRole = role == null ? null : normalizeDbRole(role);

    if (role != null && !normalizedRole) {
      return NextResponse.json(
        {
          success: false,
          message: "Role must be FOUNDER, INVESTOR, or FUND_MANAGER",
        },
        { status: 400 },
      );
    }

    const dbRole = normalizedRole || "founder";
    const normalizedEmail = String(email).toLowerCase().trim();
    await connectDB();
    let user = await User.findOne({ email: normalizedEmail });

    if (user?.status === "verified") {
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 409 },
      );
    }

    let otp = user?.otp;
    let otpExpiry = user?.otpExpiry ? new Date(user.otpExpiry) : null;
    const now = new Date();
    const otpStillValid = Boolean(otp && otpExpiry && otpExpiry > now);

    if (!user) {
      otp = generateOTP();
      otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      user = await User.create({
        email: normalizedEmail,
        role: dbRole,
        otp,
        otpExpiry,
        status: "pending_verification",
        createdAt: new Date(),
        updatedAt: new Date(),
        full_name: normalizedEmail.split("@")[0],
        password: "__pending_setup__",
      });
    } else if (!otpStillValid) {
      otp = generateOTP();
      otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await User.updateOne(
        { _id: user._id },
        { $set: { otp, otpExpiry, updatedAt: new Date() } },
      );
      user.otp = otp;
      user.otpExpiry = otpExpiry;
    }

    if (!user?._id) {
      return NextResponse.json(
        { success: false, message: "Failed to create signup session" },
        { status: 500 },
      );
    }

    let otpSent = true;

    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Your verification code",
        text: `Your verification code is ${otp}. It expires in 10 minutes.`,
        html: `<p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
      });
    } catch (emailError) {
      console.error("Signup email failed:", emailError);
      otpSent = false;
    }

    const token = signAuthToken(user, { expiresIn: "15m" });

    const cookieStore = await cookies();

    cookieStore.set("token", token, getTokenCookieOptions(15 * 60));

    cookieStore.set(
      "pending_email",
      normalizedEmail,
      getPendingEmailCookieOptions(10 * 60),
    );

    const data = {
      otpSent,
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {}),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Signup verification initiated",
        data,
      },
      { status: 200 },
    );

  } catch (error) {
    console.error("POST /api/auth/signup error:", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
