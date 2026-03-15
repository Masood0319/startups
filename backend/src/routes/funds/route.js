import connectDB from "#root/lib/mongoose.js";
import Fund from "#root/models/Fund.js";
import { fail, ok } from "#root/lib/response.js";
import { requireAuthGuard, requireRole } from "#root/lib/security/rbac.js";
import { validateSchema } from "#root/lib/security/validation.js";

const FUND_SCHEMA = {
  name: { type: "string", min: 1, max: 160, required: true },
  description: { type: "string", max: 5000 },
  thesis: { type: "string", max: 3000 },
  website: { type: "string", max: 300 },
  managerEmail: { type: "string", max: 200 },
  ownerEmail: { type: "string", max: 200 },
};

export async function POST(req) {
  try {
    const authz = await requireRole(req, ["FUND_MANAGER"]);
    if (!authz.ok) return authz.response;

    await connectDB();

    const formData = await req.formData();

    const payloadPart = formData.get("payload");
    let payload = {};
    if (payloadPart) {
      if (typeof payloadPart === "string") {
        payload = JSON.parse(payloadPart);
      } else if (typeof payloadPart.text === "function") {
        const text = await payloadPart.text();
        payload = JSON.parse(text || "{}");
      }
    }

    const validation = validateSchema(payload, FUND_SCHEMA, { stripUnknown: true });
    if (!validation.success) {
      return fail(validation.error, 400);
    }

    let logoUrl = null;
    const logoFile = formData.get("logo");
    if (logoFile && typeof logoFile.arrayBuffer === "function") {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      logoUrl = `data:${logoFile.type};base64,${buffer.toString("base64")}`;
    }

    const fund = await Fund.create({
      ...validation.data,
      createdByEmail: authz.user.email,
      createdById: authz.user._id,
      logo: logoUrl,
    });

    return ok({ id: fund._id }, 201);
  } catch (error) {
    console.error("Error creating fund:", error);
    return fail(error?.message || "Failed to create fund", 500);
  }
}

export async function GET(req) {
  try {
    const auth = await requireAuthGuard(req);
    if (!auth.ok) return auth.response;

    await connectDB();

    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine");

    let query = {};
    if (mine === "true") {
      query = {
        $or: [
          { createdByEmail: auth.user.email },
          { ownerEmail: auth.user.email },
          { managerEmail: auth.user.email },
          { createdById: auth.user._id },
        ],
      };
    } else {
      const roleCheck = await requireRole(req, ["FUND_MANAGER"]);
      if (!roleCheck.ok) return roleCheck.response;
    }

    const funds = await Fund.find(query).sort({ createdAt: -1 }).lean();
    return ok({ funds });
  } catch (error) {
    console.error("Error fetching funds:", error);
    return fail("Failed to fetch funds", 500);
  }
}
