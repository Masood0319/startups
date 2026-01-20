import { NextResponse } from "next/server";

export async function GET() {
  // Mocked recommended startups for an investor
  const startups = [
    { name: "FinSight AI", sector: "FinTech", target: 300000, blurb: "AI-driven credit underwriting" },
    { name: "GreenGrid", sector: "ClimateTech", target: 500000, blurb: "Smart EV charging network" },
    { name: "MediLink", sector: "HealthTech", target: 250000, blurb: "Interoperable EHR APIs" },
    { name: "ShopVerse", sector: "E-commerce", target: 400000, blurb: "Headless commerce for SMEs" },
  ];

  return NextResponse.json({ startups });
}
