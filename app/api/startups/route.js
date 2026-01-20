import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// Extract token from cookie header
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

export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const role = user.role;
    const allowedRoles = ["startup", "founder"]; // accept either naming
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db("Travest");
    const collection = db.collection("startups");

    // Support both JSON and multipart form-data
    const contentType = req.headers.get("content-type") || "";
    let newStartup;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const payloadBlob = formData.get("payload");
      const payloadText = payloadBlob ? await payloadBlob.text() : "{}";
      const payload = JSON.parse(payloadText);
      const logo = formData.get("logo");
      const pitch = formData.get("pitch");

      newStartup = {
        ...payload,
        userId: user._id,
        logoFileName: logo?.name || null,
        pitchDeckFileName: pitch?.name || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "pending",
      };
    } else {
      const payload = await req.json();
      newStartup = {
        ...payload,
        userId: user._id,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: payload?.status || "pending",
      };
    }

    const result = await collection.insertOne(newStartup);

    return NextResponse.json(
      {
        success: true,
        message: "Startup created",
        id: result.insertedId,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("/api/startups POST error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const client = await clientPromise;
    const db = client.db("Travest");
    const collection = db.collection("startups");

    // Read filters from query params
    const { searchParams } = new URL(req.url);
    const industry = searchParams.get("industry")?.trim();
    const geography = searchParams.get("geography")?.trim();
    const min = searchParams.get("min");
    const max = searchParams.get("max");

    const query = {};
    if (industry) {
      // support either string industry or array
      query.$or = [{ industry: industry }, { industries: { $in: [industry] } }];
    }
    if (geography) {
      query.$and = (query.$and || []).concat([{ $or: [{ geography }, { location: geography }] }]);
    }
    // Numeric investment range fields can vary; check common keys
    const minNum = min ? Number(min) : null;
    const maxNum = max ? Number(max) : null;
    if (minNum != null || maxNum != null) {
      const rangeOr = [];
      const fields = ["minInvestment", "min", "targetMin", "askMin"];
      const fieldsMax = ["maxInvestment", "max", "targetMax", "askMax"];

      if (minNum != null) {
        rangeOr.push({ $or: fields.map((f) => ({ [f]: { $gte: minNum } })) });
      }
      if (maxNum != null) {
        rangeOr.push({ $or: fieldsMax.map((f) => ({ [f]: { $lte: maxNum } })) });
      }
      if (rangeOr.length) {
        query.$and = (query.$and || []).concat(rangeOr);
      }
    }

    const startups = await collection.find(query).sort({ createdAt: -1 }).toArray();

    return NextResponse.json(startups, { status: 200 });
  } catch (err) {
    console.error("/api/startups GET error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}