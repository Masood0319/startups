import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import connectDB from "#root/lib/mongoose.js";
import User from "#root/models/User.js";
import { fail, ok } from "#root/lib/response.js";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) return fail("Email is required", 400);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail("Invalid email format", 400);
    }

    await connectDB();

    const normalized = email.toLowerCase();
    const user = await User.findOne({ email: normalized });

    if (user) {
      const resetToken = uuidv4();
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            resetToken,
            resetTokenExpiry,
            updatedAt: new Date(),
          },
        },
      );

      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/resetPassword?token=${resetToken}`;

          await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: "Password Reset - Travest Platform",
            text: `Reset your password: ${resetUrl}`,
            html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
          });
        } catch (emailError) {
          console.error("Failed to send reset email:", emailError);
        }
      }
    }

    return ok({
      message:
        "If an account with that email exists, we've sent you a password reset link.",
    });
  } catch (error) {
    console.error("POST /api/forgot-password error:", error);
    return fail("Internal server error", 500);
  }
}

export async function PUT(req) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return fail("Reset token and new password are required", 400);
    }

    if (newPassword.length < 6) {
      return fail("Password must be at least 6 characters long", 400);
    }

    await connectDB();

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return fail("Invalid or expired reset token", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
        $unset: {
          resetToken: "",
          resetTokenExpiry: "",
        },
      },
    );

    return ok({
      message: "Password has been successfully reset. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("PUT /api/forgot-password error:", error);
    return fail("Internal server error", 500);
  }
}
