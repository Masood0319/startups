import { cookies } from "#root/shims/nextHeaders.js";
import connectDB from "#root/lib/mongoose.js";
import User from "#root/models/User.js";
import { signAuthToken, verifyAuthToken, toDbRole } from "./jwt.js";
import { isValidObjectId } from "#root/lib/security/objectId.js";

function readCookieToken(cookieHeader = "") {
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function extractToken(req = null) {
  if (req) {
    const fromCookie = readCookieToken(req.headers.get("cookie") || "");
    if (fromCookie) return fromCookie;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.slice(7);
    }
    return null;
  }

  const cookieStore = await cookies();
  return cookieStore.get("token")?.value || null;
}

export async function verifyToken(req = null) {
  const token = await extractToken(req);
  if (!token) return null;
  try {
    return verifyAuthToken(token);
  } catch {
    return null;
  }
}

export async function getAuthContext(req = null) {
  try {
    const payload = await verifyToken(req);
    if (!payload?.userId || !isValidObjectId(payload.userId)) {
      return { user: null, userId: null, tokenRole: null };
    }

    await connectDB();

    const user = await User.findById(payload.userId)
      .select("-password -otp -resetToken -resetTokenExpiry")
      .lean();

    if (!user) {
      return { user: null, userId: null, tokenRole: null };
    }

    return {
      user,
      userId: payload.userId,
      tokenRole: payload.role,
      payload,
    };
  } catch {
    return { user: null, userId: null, tokenRole: null };
  }
}

export async function requireAuth(req) {
  const { user, userId } = await getAuthContext(req);
  if (!user || !userId) {
    return {
      success: false,
      user: null,
      response: new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      ),
    };
  }

  return { success: true, user, userId, response: null };
}

export function hasRole(user, requiredRoles) {
  if (!user?.role) return false;

  const normalized = (Array.isArray(requiredRoles)
    ? requiredRoles
    : [requiredRoles]
  ).map((r) => String(r).toLowerCase());

  const userDbRole = String(user.role).toLowerCase();
  return normalized.includes(userDbRole);
}

export function generateToken(user, options = {}) {
  return signAuthToken(user, options);
}

export function getUserId(id) {
  if (!id) return null;
  return typeof id === "string" ? id : id.toString();
}

export function tokenRoleToDbRole(tokenRole) {
  return toDbRole(tokenRole);
}
