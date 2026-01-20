import { getUsersCollection } from "@/lib/mongodb";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function POST(req) {
  try {
    const { password, is2FAEnabled = false, secretKey } = await req.json();

    if (!password || password.length < 6) {
      return Response.json({ success: false, message: "Password must be at least 6 characters" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const stageToken = cookieStore.get("stage")?.value;
    if (!stageToken) {
      return Response.json({ success: false, message: "Not authorized for setup" }, { status: 401 });
    }

    let payload;
    try {
      payload = jwt.verify(stageToken, JWT_SECRET);
    } catch {
      return Response.json({ success: false, message: "Stage expired. Please verify again." }, { status: 401 });
    }

    const email = payload?.email;
    if (!email) {
      return Response.json({ success: false, message: "Invalid stage context" }, { status: 400 });
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ email });
    if (!user || user.status !== "verified") {
      return Response.json({ success: false, message: "User must be verified first" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const update = {
      $set: {
        password: hashedPassword,
        is2FAEnabled: Boolean(is2FAEnabled),
        updatedAt: new Date(),
      },
    };

    if (Boolean(is2FAEnabled)) {
      if (!secretKey) {
        return Response.json({ success: false, message: "2FA secret key is required when enabling 2FA" }, { status: 400 });
      }
      update.$set.secretKey = secretKey;
    } else {
      update.$unset = { secretKey: "" };
    }

    await users.updateOne({ email }, update);

    // Set main session token (7 days)
    const token = jwt.sign({ id: user._id, email }, JWT_SECRET, { expiresIn: "7d" });
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Clear stage cookie
    cookieStore.set("stage", "", { httpOnly: true, path: "/", maxAge: 0 });

    return Response.json({ success: true, message: "Setup complete" });
  } catch (err) {
    console.error("/api/auth/setup error:", err);
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}