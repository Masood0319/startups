import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(_req, { params }) {
  try {
    const { id } = params
    const client = await clientPromise;
    const db = client.db("Travest");
    const collection = db.collection("users");

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const user = await collection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (err) {
    console.error("/api/users/[id] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


export async function PUT(req, { params }) {
  try {
    const { id } = params
    const body = await req.json()
    const client = await clientPromise;
    const db = client.db("Travest");
    const collection = db.collection("users");

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const user = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: body }
  );
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (err) {
    console.error("/api/users/[id] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
