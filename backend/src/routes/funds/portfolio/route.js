import { ok } from "#root/lib/response.js";
import { requireRole } from "#root/lib/security/rbac.js";

export async function GET(req) {
  const authz = await requireRole(req, ["FUND_MANAGER"]);
  if (!authz.ok) return authz.response;

  const startups = [
    { name: "NeoPay", sector: "FinTech", investment: 120000, stage: "Seed" },
    { name: "TerraFoods", sector: "AgriTech", investment: 200000, stage: "Pre-Seed" },
    { name: "BioSense", sector: "BioTech", investment: 350000, stage: "Series A" },
    { name: "FleetIQ", sector: "Mobility", investment: 90000, stage: "Seed" },
  ];

  return ok({ startups });
}
