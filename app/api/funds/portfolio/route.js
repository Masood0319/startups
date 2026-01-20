import { NextResponse } from "next/server";

export async function GET() {
  // Mocked portfolio data for a fund manager
  const startups = [
    { name: "NeoPay", sector: "FinTech", investment: 120000, stage: "Seed" },
    { name: "TerraFoods", sector: "AgriTech", investment: 200000, stage: "Pre-Seed" },
    { name: "BioSense", sector: "BioTech", investment: 350000, stage: "Series A" },
    { name: "FleetIQ", sector: "Mobility", investment: 90000, stage: "Seed" },
  ];

  return NextResponse.json({ startups });
}
