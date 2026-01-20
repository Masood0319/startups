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
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const email = payload?.email;
    if (!email) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const users = await getUsersCollection();
    const user = await users.findOne(
      { email },
      { projection: { email: 1, full_name:1, role: 1, _id: 1 } }
    );

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      id: user._id?.toString?.() || null,
      email: user.email,
      name: user.full_name,
      role: user.role || null,
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
