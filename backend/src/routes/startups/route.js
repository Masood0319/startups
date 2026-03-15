import connectDB from "#root/lib/mongoose.js";
import Startup from "#root/models/Startup.js";
import { fail, ok } from "#root/lib/response.js";
import { requireAuthGuard, requireRole } from "#root/lib/security/rbac.js";
import { validateSchema } from "#root/lib/security/validation.js";

const STARTUP_CREATE_SCHEMA = {
  name: { type: "string", min: 1, max: 120, required: true },
  description: { type: "string", min: 1, max: 5000, required: true },
  industry: { type: "string", min: 1, max: 120 },
  industries: { type: "array:string", maxItems: 30 },
  geography: { type: "string", max: 120 },
  location: { type: "string", max: 120 },
  website: { type: "string", max: 300 },
  fundingTarget: { type: "number", min: 0 },
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

export async function POST(req) {
  try {
    const authz = await requireRole(req, ["FOUNDER"]);
    if (!authz.ok) return authz.response;
    if (!authz.user?._id) return fail("Authentication required", 401);

    await connectDB();

    const contentType = req.headers.get("content-type") || "";
    let payload = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const payloadBlob = formData.get("payload");
      const payloadText = payloadBlob ? await payloadBlob.text() : "{}";
      payload = JSON.parse(payloadText);

      const validation = validateSchema(payload, STARTUP_CREATE_SCHEMA, {
        stripUnknown: true,
      });
      if (!validation.success) {
        return fail(validation.error, 400);
      }

      const logo = formData.get("logo");
      const pitch = formData.get("pitch");

      payload = {
        ...validation.data,
        logoFileName: logo?.name || null,
        pitchDeckFileName: pitch?.name || null,
      };
    } else {
      const body = await req.json();
      const validation = validateSchema(body, STARTUP_CREATE_SCHEMA, {
        stripUnknown: true,
      });
      if (!validation.success) {
        return fail(validation.error, 400);
      }
      payload = validation.data;
    }

    const startup = await Startup.create({
      ...payload,
      userId: authz.user._id,
      status: "pending",
    });

    return ok({ id: startup._id }, 201);
  } catch (err) {
    console.error("/api/startups POST error:", err);
    return fail("Internal server error", 500);
  }
}

export async function GET(req) {
  try {
    const auth = await requireAuthGuard(req);
    if (!auth.ok) return auth.response;
    if (!auth.user?._id) return fail("Authentication required", 401);

    await connectDB();

    const { searchParams } = new URL(req.url);
    const industry = searchParams.get("industry")?.trim();
    const geography = searchParams.get("geography")?.trim();
    const min = searchParams.get("min");
    const max = searchParams.get("max");

    const query = {};
    if (industry) {
      query.$or = [{ industry }, { industries: { $in: [industry] } }];
    }
    if (geography) {
      query.$and = (query.$and || []).concat([
        { $or: [{ geography }, { location: geography }] },
      ]);
    }

    const minNum = min != null ? Number(min) : null;
    const maxNum = max != null ? Number(max) : null;
    if ((min != null && Number.isNaN(minNum)) || (max != null && Number.isNaN(maxNum))) {
      return fail("Invalid min/max query parameter", 400);
    }

    if (minNum != null || maxNum != null) {
      const range = {};
      if (minNum != null) range.$gte = minNum;
      if (maxNum != null) range.$lte = maxNum;
      query.fundingTarget = range;
    }

    const startups = await Startup.find(query).sort({ createdAt: -1 }).lean();
    return ok({ startups });
  } catch (err) {
    console.error("/api/startups GET error:", err);
    return fail("Internal server error", 500);
  }
}
