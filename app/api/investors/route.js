import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthContext } from "@/app/api/_utils/auth";
import { getInvestorsCollection } from "@/lib/collections";

export async function GET(req) {
  try {
    const { user } = await getAuthContext();
    const col = await getInvestorsCollection();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const doc = await col.findOne({ _id: new ObjectId(id) });
      if (!doc) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
      return NextResponse.json({ success: true, investor: doc });
    }

    if (user) {
      const me = await col.findOne({ userId: String(user._id) });
      if (me) return NextResponse.json({ success: true, investor: me });
    }

    const items = await col.find({}).limit(50).toArray();
    return NextResponse.json({ success: true, investors: items });
  } catch (err) {
    console.error("GET /api/investors error", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

async function parseBody(req) {
  const ct = (req.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    return await req.json();
  }
  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    const obj = {};
    for (const [k, v] of fd.entries()) {
      if (typeof v === "string") obj[k] = v;
      else if (v && typeof v.name === "string") obj[k] = v.name; // ignore file content here; store separately if needed
    }
    return obj;
  }
  if (ct.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    const obj = {};
    for (const [k, v] of params.entries()) obj[k] = v;
    return obj;
  }
  // Fallback: try json then text
  try { return await req.json(); } catch {}
  const text = await req.text();
  return { _raw: text };
}

export async function POST(req) {
  try {
    const { user } = await getAuthContext();
    const col = await getInvestorsCollection();

    const body = await parseBody(req);
    const now = new Date();

    const payload = {
      ...body,
      userId: user ? String(user._id) : body.userId || null,
      updatedAt: now,
    };

    // Upsert by userId or email if provided
    const filter = payload.userId ? { userId: payload.userId } : (payload.email ? { email: payload.email } : null);
    if (filter) {
      const res = await col.updateOne(filter, {
        $set: payload,
        $setOnInsert: { createdAt: now },
      }, { upsert: true });
      const id = res.upsertedId ? res.upsertedId : (await col.findOne(filter))?._id;
      return NextResponse.json({ success: true, id });
    } else {
      const res = await col.insertOne({ ...payload, createdAt: now });
      return NextResponse.json({ success: true, id: res.insertedId });
    }
  } catch (err) {
    console.error("POST /api/investors error", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
