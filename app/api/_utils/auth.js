import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getUsersCollection } from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function getAuthContext() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return { user: null };
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = await getUsersCollection();
    const user = await users.findOne({ _id: typeof payload.id === "string" ? { $oid: payload.id } : payload.id });
    // If direct ObjectId resolution above is not supported by driver here (route context), fallback by email.
    if (!user && payload.email) {
      const userByEmail = await users.findOne({ email: payload.email });
      return { user: userByEmail || null, payload };
    }
    return { user, payload };
  } catch {
    return { user: null };
  }
}
