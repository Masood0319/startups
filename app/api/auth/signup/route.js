import { getUsersCollection } from "@/lib/mongodb";
import sendEmail from "@/app/utils/sendEmail";
import { cookies } from "next/headers";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return Response.json({ success: false, message: "Valid email is required" }, { status: 400 });
    }

    const users = await getUsersCollection();

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert user with pending verification
    const update = {
      $set: {
        email,
        otp,
        otpExpiry,
        status: "pending_verification",
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    };

    await users.updateOne({ email }, update, { upsert: true });

    // Send OTP email
    const subject = "Your verification code";
    const text = `Your verification code is ${otp}. It expires in 10 minutes.`;
    const html = `<p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`;

    await sendEmail({ to: email, subject, text, html });

    // Set pending email as httpOnly cookie for verify step
    (await cookies()).set("pending_email", email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60, // 10 minutes
    });

    return Response.json({ success: true, message: "OTP sent to email" }, { status: 200 });
  } catch (err) {
    console.error("/api/auth/signup error:", err);
    if (err?.code === 11000) {
      return Response.json({ success: false, message: "Email already in use" }, { status: 409 });
    }
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}