import { NextResponse } from "next/server";

export async function GET() {
  const investors = [
    { name: "Aditi Sharma", focusArea: "FinTech, B2B SaaS" },
    { name: "Omar Khan", focusArea: "ClimateTech, Energy" },
    { name: "Li Wei", focusArea: "DeepTech, Robotics" },
    { name: "Sara Patel", focusArea: "HealthTech, AI" },
  ];

  return NextResponse.json({ investors });
}
