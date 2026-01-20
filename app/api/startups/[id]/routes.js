// app/api/startups/[id]/route.js
import { connectDB } from "@/lib/mongodb";
import Startup from "@/models/Startup";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  await connectDB();
  try {
    const startup = await Startup.findById(params.id);
    if (!startup) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(startup);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
