import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getUsersCollection } from "@/lib/mongodb";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function GET() {
  try {
    const cookieStore = await cookies(); // ✅ must await in Next.js 15+
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = payload?.email;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return full user data, excluding sensitive fields if needed
    const { password, ...userData } = user;
    return NextResponse.json({ user: userData });
  } catch (err) {
    console.error("Error fetching user:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
