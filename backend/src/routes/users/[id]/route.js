import connectDB from "#root/lib/mongoose.js";
import User from "#root/models/User.js";
import { fail, ok } from "#root/lib/response.js";
import { requireAuthGuard, requireRole } from "#root/lib/security/rbac.js";
import { validateSchema } from "#root/lib/security/validation.js";
import { isValidObjectId, toObjectId } from "#root/lib/security/objectId.js";

const USER_UPDATE_SCHEMA = {
  full_name: { type: "string", min: 1, max: 120 },
  bio: { type: "string", max: 500 },
  avatar: { type: "string", max: 500 },
  location: { type: "string", max: 120 },
  website: { type: "string", max: 300 },
  linkedin: { type: "string", max: 300 },
  twitter: { type: "string", max: 300 },
  industries: { type: "array:string", maxItems: 20 },
};

function sanitizeUser(user) {
  if (!user) return null;
  const {
    password,
    otp,
    otpExpiry,
    resetToken,
    resetTokenExpiry,
    ...safe
  } = user;
  return safe;
}

async function canAccessUser(req, targetUserId) {
  const auth = await requireAuthGuard(req);
  if (!auth.ok) return auth;

  if (auth.userId === targetUserId) return auth;

  const roleCheck = await requireRole(req, ["FUND_MANAGER"]);
  if (!roleCheck.ok) {
    return { ok: false, response: fail("Forbidden", 403) };
  }

  return auth;
}

export async function GET(req, { params }) {
  try {
    const { id } = params;
    if (!isValidObjectId(id)) {
      return fail("Invalid id", 400);
    }

    const access = await canAccessUser(req, id);
    if (!access.ok) return access.response;

    await connectDB();

    const user = await User.findById(id)
      .select("-password -otp -otpExpiry -resetToken -resetTokenExpiry")
      .lean();

    if (!user) {
      return fail("Not found", 404);
    }

    return ok({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("/api/users/[id] GET error:", err);
    return fail("Internal server error", 500);
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    if (!isValidObjectId(id)) {
      return fail("Invalid id", 400);
    }

    const access = await canAccessUser(req, id);
    if (!access.ok) return access.response;

    const body = await req.json();
    const validation = validateSchema(body, USER_UPDATE_SCHEMA, {
      stripUnknown: true,
    });
    if (!validation.success) {
      return fail(validation.error, 400);
    }

    if (Object.keys(validation.data).length === 0) {
      return fail("No valid fields provided", 400);
    }

    await connectDB();

    const result = await User.updateOne(
      { _id: toObjectId(id) },
      { $set: { ...validation.data, updatedAt: new Date() } },
    );

    if (!result.matchedCount) {
      return fail("Not found", 404);
    }

    const updated = await User.findById(id)
      .select("-password -otp -otpExpiry -resetToken -resetTokenExpiry")
      .lean();

    return ok({ user: sanitizeUser(updated) });
  } catch (err) {
    console.error("/api/users/[id] PUT error:", err);
    return fail("Internal server error", 500);
  }
}
