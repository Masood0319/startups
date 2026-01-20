import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Travet";

export async function GET() {
  try {
    // Ensure user is in setup stage or already authenticated
    const cookieStore = await cookies();
    const stage = cookieStore.get("stage")?.value;
    const token = cookieStore.get("token")?.value;

    if (!stage && !token) {
      return Response.json({ success: false, message: "Not authorized" }, { status: 401 });
    }

    let email = "";
    if (stage) {
      try {
        const payload = jwt.verify(stage, JWT_SECRET);
        email = payload?.email || "";
      } catch {/* ignore */}
    }

    // Dynamic import to prevent build failure if deps are missing
    let speakeasy;
    try {
      // @ts-ignore
      speakeasy = (await import("speakeasy")).default ?? (await import("speakeasy"));
    } catch (e) {
      return Response.json({ success: false, message: "speakeasy is not installed. Please add 'speakeasy' to dependencies." }, { status: 500 });
    }

    let qrcode;
    try {
      // @ts-ignore
      qrcode = (await import("qrcode")).default ?? (await import("qrcode"));
    } catch (e) {
      // Optional: continue without QR image
    }

    const secret = speakeasy.generateSecret({ name: `${APP_NAME}${email ? ` (${email})` : ""}` });
    const otpauth_url = secret.otpauth_url;

    let qrDataUrl = null;
    if (qrcode && otpauth_url) {
      try {
        qrDataUrl = await qrcode.toDataURL(otpauth_url);
      } catch {/* ignore */}
    }

    return Response.json({
      success: true,
      secret: secret.base32,
      otpauth_url,
      qrDataUrl,
    });
  } catch (err) {
    console.error("/api/auth/prepare-2fa error:", err);
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
