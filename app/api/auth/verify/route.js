import { getUsersCollection } from "@/lib/mongodb";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { otp, email: emailInBody } = body;

    if (!otp) {
      return Response.json({ success: false, message: "OTP is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const pendingCookie = cookieStore.get("pending_email");
    const email = emailInBody || pendingCookie?.value;

    if (!email) {
      return Response.json({ success: false, message: "Email context missing. Please start over." }, { status: 400 });
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ email });
    if (!user || !user.otp || !user.otpExpiry) {
      return Response.json({ success: false, message: "OTP not generated. Please sign up again." }, { status: 400 });
    }

    if (user.otp !== otp) {
      return Response.json({ success: false, message: "Invalid OTP" }, { status: 401 });
    }

    if (new Date(user.otpExpiry) < new Date()) {
      return Response.json({ success: false, message: "OTP expired" }, { status: 401 });
    }

    await users.updateOne(
      { email },
      {
        $set: { status: "verified", updatedAt: new Date() },
        $unset: { otp: "", otpExpiry: "" },
      }
    );

    // Clear pending email cookie
    cookieStore.set("pending_email", "", { httpOnly: true, path: "/", maxAge: 0 });

    // Set a short-lived stage token to proceed to setup
    const stageToken = jwt.sign({ email, stage: "verified" }, JWT_SECRET, { expiresIn: "15m" });
    cookieStore.set("stage", stageToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    return Response.json({ success: true, message: "Email verified" });
  } catch (err) {
    console.error("/api/auth/verify error:", err);
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}