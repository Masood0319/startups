import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function getTokenFromHeaders(req) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function getAuthUser(req) {
  const token = getTokenFromHeaders(req);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const client = await clientPromise;
    const db = client.db("Travest");
    const users = db.collection("users");
    const user = await users.findOne({ _id: new ObjectId(payload.id) });
    return user || null;
  } catch {
    return null;
  }
}

export async function GET(_req, { params }) {
  try {
    const client = await clientPromise;
    const db = client.db("Travest");
    const collection = db.collection("startups");

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const startup = await collection.findOne({ _id: new ObjectId(params.id) });
    if (!startup) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(startup, { status: 200 });
  } catch (err) {
    console.error("/api/startups/[id] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const allowedRoles = ["startup", "founder"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db("Travest");
    const collection = db.collection("startups");

    const body = await req.json();

    // Enforce ownership: only creator can update
    const existing = await collection.findOne({ _id: new ObjectId(params.id) });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId?.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateDoc = {
      ...body,
      updatedAt: new Date(),
    };
    delete updateDoc._id;
    delete updateDoc.userId; // don't allow ownership transfer

    await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateDoc }
    );

    const updated = await collection.findOne({ _id: new ObjectId(params.id) });
    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("/api/startups/[id] PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const allowedRoles = ["startup", "founder"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db("Travest");
    const collection = db.collection("startups");

    const existing = await collection.findOne({ _id: new ObjectId(params.id) });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId?.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await collection.deleteOne({ _id: new ObjectId(params.id) });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("/api/startups/[id] DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
