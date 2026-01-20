"use client"

// app/api/dashboard/route.js
import { NextResponse } from "next/server";
import { useRouter } from "next/navigation";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const router = useRouter()

  if (role === "fundmanager") {
    router.push("fundManagerDashboard")
  }

  if (role === "investor") {
    router.push("dashboard/investor")
  }

  if (role === "founder") {
    router.push("dashboard/founder")
  }

  return NextResponse.json({ error: "Role not recognized" }, { status: 400 });
}
