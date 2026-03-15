import connectDB from "#root/lib/mongoose.js";
import Startup from "#root/models/Startup.js";
import { fail, ok } from "#root/lib/response.js";
import { requireAuthGuard, requireRole } from "#root/lib/security/rbac.js";
import { validateSchema } from "#root/lib/security/validation.js";
import { isValidObjectId, toObjectId } from "#root/lib/security/objectId.js";

const STARTUP_UPDATE_SCHEMA = {
  name: { type: "string", min: 1, max: 120 },
  description: { type: "string", min: 1, max: 5000 },
  industry: { type: "string", min: 1, max: 120 },
  industries: { type: "array:string", maxItems: 30 },
  geography: { type: "string", max: 120 },
  location: { type: "string", max: 120 },
  website: { type: "string", max: 300 },
  fundingTarget: { type: "number", min: 0 },
  fundingRaised: { type: "number", min: 0 },
  valuation: { type: "number", min: 0 },
  stage: {
    type: "enum",
    values: [
      "idea",
      "prototype",
      "mvp",
      "pre-seed",
      "seed",
      "series-a",
      "series-b",
      "series-c",
      "growth",
    ],
  },
};

async function getOwnedStartup(startupId, userId) {
  const existing = await Startup.findById(startupId).lean();
  if (!existing) return { error: fail("Not found", 404) };
  if (existing.userId?.toString() !== userId.toString()) {
    return { error: fail("Forbidden", 403) };
  }
  return { existing };
}

export async function GET(req, { params }) {
  try {
    const auth = await requireAuthGuard(req);
    if (!auth.ok) return auth.response;

    if (!isValidObjectId(params.id)) {
      return fail("Invalid id", 400);
    }

    await connectDB();

    const startup = await Startup.findById(params.id).lean();
    if (!startup) {
      return fail("Not found", 404);
    }

    return ok({ startup });
  } catch (err) {
    console.error("/api/startups/[id] GET error:", err);
    return fail("Internal server error", 500);
  }
}

export async function PUT(req, { params }) {
  try {
    if (!isValidObjectId(params.id)) {
      return fail("Invalid id", 400);
    }

    const authz = await requireRole(req, ["FOUNDER"]);
    if (!authz.ok) return authz.response;

    await connectDB();

    const ownership = await getOwnedStartup(params.id, authz.user._id);
    if (ownership.error) return ownership.error;

    const body = await req.json();
    const validation = validateSchema(body, STARTUP_UPDATE_SCHEMA, {
      stripUnknown: true,
    });
    if (!validation.success) {
      return fail(validation.error, 400);
    }
    if (Object.keys(validation.data).length === 0) {
      return fail("No valid fields provided", 400);
    }

    await Startup.updateOne(
      { _id: toObjectId(params.id) },
      { $set: { ...validation.data, updatedAt: new Date() } },
    );

    const updated = await Startup.findById(params.id).lean();
    return ok({ startup: updated });
  } catch (err) {
    console.error("/api/startups/[id] PUT error:", err);
    return fail("Internal server error", 500);
  }
}

export async function DELETE(req, { params }) {
  try {
    if (!isValidObjectId(params.id)) {
      return fail("Invalid id", 400);
    }

    const authz = await requireRole(req, ["FOUNDER"]);
    if (!authz.ok) return authz.response;

    await connectDB();

    const ownership = await getOwnedStartup(params.id, authz.user._id);
    if (ownership.error) return ownership.error;

    await Startup.deleteOne({ _id: toObjectId(params.id) });
    return ok({ deleted: true });
  } catch (err) {
    console.error("/api/startups/[id] DELETE error:", err);
    return fail("Internal server error", 500);
  }
}
