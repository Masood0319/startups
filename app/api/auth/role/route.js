import { getUsersCollection } from "@/lib/mongodb";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const ROLE_REDIRECTS = {
  investor: "/onboarding/investor",
  founder: "/onboarding/founder",
};

export async function POST(req) {
  try {
    const { role } = await req.json();
    if (!role || !["investor", "founder", "fund_manager"].includes(role)) {
      return Response.json({ success: false, message: "Invalid role" }, { status: 400 });
    }

    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return Response.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return Response.json({ success: false, message: "Invalid session" }, { status: 401 });
    }

    const email = payload?.email;
    if (!email) {
      return Response.json({ success: false, message: "Invalid session context" }, { status: 400 });
    }

    const users = await getUsersCollection();
    await users.updateOne({ email }, { $set: { role, updatedAt: new Date() } });

    const redirect = ROLE_REDIRECTS[role];
    return Response.json({ success: true, redirect });
  } catch (err) {
    console.error("/api/auth/role error:", err);
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
