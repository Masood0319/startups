import connectDB from "#root/lib/mongoose.js";
import Investment from "#root/models/Investment.js";
import Contract from "#root/models/Contract.js";
import Startup from "#root/models/Startup.js";
import { fail, ok } from "#root/lib/response.js";
import { requireRole } from "#root/lib/security/rbac.js";
import { validateSchema } from "#root/lib/security/validation.js";
import { isValidObjectId, toObjectId } from "#root/lib/security/objectId.js";
import {
  HARAM_INDUSTRIES,
  hasProhibitedTerms,
  normalizeType,
} from "#root/lib/collections.js";

const SUPPORTED_TYPES = new Set([
  "equity",
  "profit-sharing",
  "safe",
  "revenue-sharing",
  "crowdfunding",
]);

function toIdString(value) {
  if (!value) return "";
  return typeof value === "string" ? value : value.toString();
}

function toResponseInvestment(doc) {
  return {
    ...doc,
    _id: toIdString(doc._id),
    investorId: toIdString(doc.investorId),
    startupId: toIdString(doc.startupId),
    createdBy: toIdString(doc.createdBy),
  };
}

function validateTypeOrFail(rawType) {
  const type = normalizeType(rawType);
  if (!SUPPORTED_TYPES.has(type)) {
    return { ok: false, response: fail("Unknown investment type", 400) };
  }
  return { ok: true, type };
}

function validateByType(type, body) {
  const errors = [];
  const { amount, terms } = body;

  if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    errors.push("Amount must be a positive number");
  }
  if (!terms || typeof terms !== "object" || Array.isArray(terms)) {
    errors.push("Terms are required");
  }
  if (hasProhibitedTerms(terms)) {
    errors.push(
      "Terms contain prohibited fixed-interest or guaranteed-return clauses",
    );
  }

  switch (type) {
    case "equity":
      if (terms?.equityPercent == null) {
        errors.push("Equity percent is required for equity investment");
      }
      break;
    case "profit-sharing":
      if (
        terms?.profitRatioInvestor == null ||
        terms?.profitRatioStartup == null
      ) {
        errors.push("Profit-sharing ratios are required");
      }
      break;
    case "safe":
      break;
    case "revenue-sharing":
      if (
        terms?.revenueSharePercent == null ||
        terms?.returnCapMultiple == null
      ) {
        errors.push(
          "Revenue share percent and return cap multiple are required",
        );
      }
      break;
    case "crowdfunding":
      if (terms?.poolTerms == null) {
        errors.push("Pool terms are required for crowdfunding");
      }
      break;
    default:
      errors.push("Unknown investment type");
  }

  return errors;
}

async function ensureStartupIsHalal(startupId) {
  const startup = await Startup.findById(startupId)
    .select("industry industries")
    .lean();

  if (!startup) return { ok: false, message: "Startup not found" };

  const industries = []
    .concat(startup.industry ? [String(startup.industry).toLowerCase()] : [])
    .concat(
      Array.isArray(startup.industries)
        ? startup.industries.map((i) => String(i).toLowerCase())
        : [],
    );
  const isHaram = industries.some((i) => HARAM_INDUSTRIES.includes(i));

  if (isHaram) {
    return {
      ok: false,
      message: "Investment blocked: industry not Shariah-compliant",
    };
  }
  return { ok: true };
}

const CREATE_SCHEMA = {
  investorId: { type: "string", required: true },
  startupId: { type: "string", required: true },
  amount: { type: "number", min: 0.01, required: true },
  terms: { type: "object", required: true },
};

const UPDATE_SCHEMA = {
  id: { type: "string", required: true },
  status: {
    type: "enum",
    values: ["pending", "approved", "declined", "completed", "canceled"],
  },
  amount: { type: "number", min: 0.01 },
  terms: { type: "object" },
};

export async function GET(req, { params }) {
  try {
    const authz = await requireRole(req, ["INVESTOR", "FOUNDER", "FUND_MANAGER"]);
    if (!authz.ok) return authz.response;

    const typeValidation = validateTypeOrFail(params.type);
    if (!typeValidation.ok) return typeValidation.response;

    await connectDB();

    const { searchParams } = new URL(req.url);
    const investorId = searchParams.get("investorId");
    const startupId = searchParams.get("startupId");
    const id = searchParams.get("id");
    const authUserId = toObjectId(authz.userId);

    const query = { type: typeValidation.type };

    if (investorId) {
      if (!isValidObjectId(investorId)) return fail("Invalid investorId", 400);
      query.investorId = toObjectId(investorId);
    }
    if (startupId) {
      if (!isValidObjectId(startupId)) return fail("Invalid startupId", 400);
      query.startupId = toObjectId(startupId);
    }
    if (id) {
      if (!isValidObjectId(id)) return fail("Invalid id", 400);
      query._id = toObjectId(id);
    }

    if (authz.tokenRole !== "FUND_MANAGER") {
      query.$or = [{ investorId: authUserId }, { createdBy: authUserId }];
    }

    const items = await Investment.find(query).sort({ createdAt: -1 }).lean();
    return ok({ items: items.map(toResponseInvestment) });
  } catch (err) {
    console.error("GET /api/investments/[type] error", err);
    return fail("Internal server error", 500);
  }
}

export async function POST(req, { params }) {
  try {
    const authz = await requireRole(req, ["INVESTOR", "FOUNDER", "FUND_MANAGER"]);
    if (!authz.ok) return authz.response;

    const typeValidation = validateTypeOrFail(params.type);
    if (!typeValidation.ok) return typeValidation.response;

    const bodyRaw = await req.json();
    const validation = validateSchema(bodyRaw, CREATE_SCHEMA, {
      stripUnknown: true,
    });
    if (!validation.success) return fail(validation.error, 400);

    const { investorId, startupId, amount, terms } = validation.data;

    if (!isValidObjectId(investorId)) return fail("Invalid investorId", 400);
    if (!isValidObjectId(startupId)) return fail("Invalid startupId", 400);

    if (authz.tokenRole === "INVESTOR" && investorId !== authz.userId) {
      return fail("Forbidden", 403);
    }

    await connectDB();

    const errors = validateByType(typeValidation.type, { amount, terms });
    const halal = await ensureStartupIsHalal(toObjectId(startupId));
    if (!halal.ok) errors.push(halal.message);
    if (errors.length) return fail(errors.join("; "), 400);

    const authUserId = toObjectId(authz.userId);
    const now = new Date();
    const investment = await Investment.create({
      investorId: toObjectId(investorId),
      startupId: toObjectId(startupId),
      amount: Number(amount),
      type: typeValidation.type,
      terms,
      status: "pending",
      createdBy: authUserId,
      createdAt: now,
      updatedAt: now,
    });

    const contract = await Contract.create({
      investmentId: investment._id,
      investorId: investment.investorId,
      startupId: investment.startupId,
      amount: investment.amount,
      type: investment.type,
      terms: investment.terms,
      status: "draft",
      createdBy: authUserId,
      createdAt: now,
      updatedAt: now,
    });

    return ok({ id: investment._id.toString(), contractId: contract._id.toString() }, 201);
  } catch (err) {
    console.error("POST /api/investments/[type] error", err);
    return fail("Internal server error", 500);
  }
}

export async function PUT(req, { params }) {
  try {
    const authz = await requireRole(req, ["INVESTOR", "FOUNDER", "FUND_MANAGER"]);
    if (!authz.ok) return authz.response;

    const typeValidation = validateTypeOrFail(params.type);
    if (!typeValidation.ok) return typeValidation.response;

    const bodyRaw = await req.json();
    const validation = validateSchema(bodyRaw, UPDATE_SCHEMA, {
      stripUnknown: true,
    });
    if (!validation.success) return fail(validation.error, 400);

    const { id, status, terms, amount } = validation.data;
    if (!isValidObjectId(id)) return fail("Invalid id", 400);

    await connectDB();

    const investmentId = toObjectId(id);
    const existing = await Investment.findOne({
      _id: investmentId,
      type: typeValidation.type,
    });
    if (!existing) return fail("Not found", 404);

    const authUserId = toObjectId(authz.userId);
    const isOwner =
      existing.createdBy.toString() === authUserId.toString() ||
      existing.investorId.toString() === authUserId.toString();

    if (!isOwner && authz.tokenRole !== "FUND_MANAGER") {
      return fail("Forbidden", 403);
    }

    if (terms || amount) {
      const errs = validateByType(typeValidation.type, {
        amount: amount ?? existing.amount,
        terms: terms ?? existing.terms,
      });
      if (errs.length) return fail(errs.join("; "), 400);
    }

    const set = { updatedAt: new Date() };
    if (status) set.status = status;
    if (terms) set.terms = terms;
    if (amount != null) set.amount = Number(amount);

    await Investment.updateOne({ _id: investmentId }, { $set: set });
    await Contract.updateMany({ investmentId }, { $set: set });

    return ok({ updated: true });
  } catch (err) {
    console.error("PUT /api/investments/[type] error", err);
    return fail("Internal server error", 500);
  }
}

export async function DELETE(req) {
  try {
    const authz = await requireRole(req, ["INVESTOR", "FOUNDER", "FUND_MANAGER"]);
    if (!authz.ok) return authz.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!isValidObjectId(id)) return fail("Invalid id", 400);

    await connectDB();

    const investmentId = toObjectId(id);
    const existing = await Investment.findById(investmentId);
    if (!existing) return fail("Not found", 404);

    const authUserId = toObjectId(authz.userId);
    const isOwner =
      existing.createdBy.toString() === authUserId.toString() ||
      existing.investorId.toString() === authUserId.toString();

    if (!isOwner && authz.tokenRole !== "FUND_MANAGER") {
      return fail("Forbidden", 403);
    }

    await Investment.deleteOne({ _id: investmentId });
    await Contract.deleteMany({ investmentId });

    return ok({ deleted: true });
  } catch (err) {
    console.error("DELETE /api/investments/[type] error", err);
    return fail("Internal server error", 500);
  }
}
