import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// POST – create new fund
export async function POST(req) {
  try {
    const client = await clientPromise;
    const db = client.db("Travest"); // keep DB name consistent
    const collection = db.collection("funds");

    const formData = await req.formData();

    // Parse JSON payload (may arrive as string or File/Blob when appended on client)
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

    // Handle logo upload (base64 or file buffer)
    let logoUrl = null;
    const logoFile = formData.get("logo");
    if (logoFile && typeof logoFile.arrayBuffer === "function") {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      // For now, just store base64 in DB
      logoUrl = `data:${logoFile.type};base64,${buffer.toString("base64")}`;
    }

    // Set creator from session if available
    let creator = {};
    try {
      const token = (await cookies()).get("token")?.value;
      if (token) {
        const p = jwt.verify(token, JWT_SECRET);
        creator = { createdByEmail: p?.email, createdById: p?.id };
      }
    } catch {}

    const newFund = {
      ...payload,
      ...creator,
      logo: logoUrl,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(newFund);

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("Error creating fund:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to create fund" }, { status: 500 });
  }
}

// GET – list all funds or only those created by the logged-in manager when ?mine=true
export async function GET(req) {
  try {
    const client = await clientPromise;
    const db = client.db("Travest");
    const collection = db.collection("funds");

    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine");

    let query = {};
    if (mine === "true") {
      try {
        const token = (await cookies()).get("token")?.value;
        if (token) {
          const p = jwt.verify(token, JWT_SECRET);
          const email = p?.email;
          if (email) {
            query = {
              $or: [
                { createdByEmail: email },
                { ownerEmail: email },
                { managerEmail: email },
              ],
            };
          }
        }
      } catch {}
    }

    const funds = await collection.find(query).toArray();

    return NextResponse.json(funds);
  } catch (error) {
    console.error("Error fetching funds:", error);
    return NextResponse.json({ error: "Failed to fetch funds" }, { status: 500 });
  }
}


