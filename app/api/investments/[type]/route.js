import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthContext } from "@/app/api/_utils/auth";
import {
  getInvestmentsCollection,
  getContractsCollection,
  getStartupsCollection,
  HARAM_INDUSTRIES,
  hasProhibitedTerms,
  normalizeType,
} from "@/lib/collections";

function parseObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function validateByType(type, body) {
  const errors = [];
  const t = normalizeType(type);
  const { amount, terms } = body;
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    errors.push("Amount must be a positive number");
  }
  if (!terms || typeof terms !== "object") {
    errors.push("Terms are required");
  }
  if (hasProhibitedTerms(terms)) {
    errors.push("Terms contain prohibited fixed-interest or guaranteed-return clauses");
  }
  switch (t) {
    case "equity":
      if (terms?.equityPercent == null) errors.push("Equity percent is required for equity investment (Musharakah)");
      break;
    case "profit-sharing":
      if (terms?.profitRatioInvestor == null || terms?.profitRatioStartup == null) {
        errors.push("Profit-sharing ratios are required for Mudarabah");
      }
      break;
    case "safe":
      // SAFE-like; ensure no interest, typical fields: valuationCap, discount
      break;
    case "revenue-sharing":
      if (terms?.revenueSharePercent == null || terms?.returnCapMultiple == null) {
        errors.push("Revenue share percent and return cap multiple are required");
      }
      break;
    case "crowdfunding":
      if (terms?.poolTerms == null) errors.push("Pool terms are required for crowdfunding");
      break;
    default:
      errors.push("Unknown investment type");
  }
  return errors;
}

async function ensureStartupIsHalal(startupId) {
  const startups = await getStartupsCollection();
  const _id = typeof startupId === "string" ? parseObjectId(startupId) : startupId;
  if (!_id) return { ok: false, message: "Invalid startupId" };
  const startup = await startups.findOne({ _id });
  if (!startup) return { ok: false, message: "Startup not found" };
  const industries = []
    .concat(startup.industry ? [String(startup.industry).toLowerCase()] : [])
    .concat(Array.isArray(startup.industries) ? startup.industries.map((i) => String(i).toLowerCase()) : []);
  const isHaram = industries.some((i) => HARAM_INDUSTRIES.includes(i));
  if (isHaram) return { ok: false, message: "Investment blocked: industry not Shariah-compliant" };
  return { ok: true, startup };
}

export async function GET(req, { params }) {
  try {
    const type = normalizeType(params.type);
    const { searchParams } = new URL(req.url);
    const investorId = searchParams.get("investorId");
    const startupId = searchParams.get("startupId");
    const id = searchParams.get("id");

    const col = await getInvestmentsCollection();
    const query = { type };
    if (investorId) query.investorId = investorId;
    if (startupId) query.startupId = startupId;
    if (id) query._id = parseObjectId(id);

    const items = await col.find(query).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, items });
  } catch (err) {
    console.error("GET /api/investments/[type] error", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { user } = await getAuthContext();
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const type = normalizeType(params.type);
    const body = await req.json();
    const { investorId, startupId, amount, terms } = body;

    // Validate by type and Shariah compliance
    const errors = validateByType(type, { amount, terms });
    const halal = await ensureStartupIsHalal(startupId);
    if (!halal.ok) errors.push(halal.message);
    if (errors.length) return NextResponse.json({ success: false, errors }, { status: 400 });

    const investments = await getInvestmentsCollection();
    const contracts = await getContractsCollection();

    const now = new Date();
    const investment = {
      investorId,
      startupId,
      amount: Number(amount),
      type,
      terms,
      status: "pending",
      createdAt: now,
      createdBy: user._id,
    };
    const invRes = await investments.insertOne(investment);

    const contract = {
      investorId,
      startupId,
      amount: Number(amount),
      type,
      terms,
      status: "draft",
      investmentId: invRes.insertedId,
      createdAt: now,
      createdBy: user._id,
    };
    const conRes = await contracts.insertOne(contract);

    return NextResponse.json({ success: true, id: invRes.insertedId, contractId: conRes.insertedId });
  } catch (err) {
    console.error("POST /api/investments/[type] error", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { user } = await getAuthContext();
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const type = normalizeType(params.type);
    const body = await req.json();
    const { id, status, terms, amount } = body;
    const _id = parseObjectId(id);
    if (!_id) return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });

    // Optional revalidate
    if (terms || amount) {
      const errs = validateByType(type, { amount: amount ?? 1, terms: terms ?? {} });
      if (errs.length) return NextResponse.json({ success: false, errors: errs }, { status: 400 });
    }

    const investments = await getInvestmentsCollection();
    const update = { $set: { updatedAt: new Date() } };
    if (status) update.$set.status = status;
    if (terms) update.$set.terms = terms;
    if (amount != null) update.$set.amount = Number(amount);

    await investments.updateOne({ _id, type }, update);

    const contracts = await getContractsCollection();
    await contracts.updateMany({ investmentId: _id }, update);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT /api/investments/[type] error", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user } = await getAuthContext();
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const _id = parseObjectId(id);
    if (!_id) return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });

    const investments = await getInvestmentsCollection();
    const contracts = await getContractsCollection();
    await investments.deleteOne({ _id });
    await contracts.deleteMany({ investmentId: _id });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/investments/[type] error", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
