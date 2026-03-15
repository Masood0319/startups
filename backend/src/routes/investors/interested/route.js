import { ok } from "#root/lib/response.js";
import { requireAuthGuard } from "#root/lib/security/rbac.js";

export async function GET(req) {
  const auth = await requireAuthGuard(req);
  if (!auth.ok) return auth.response;

  const investors = [
    { name: "Aditi Sharma", focusArea: "FinTech, B2B SaaS" },
    { name: "Omar Khan", focusArea: "ClimateTech, Energy" },
    { name: "Li Wei", focusArea: "DeepTech, Robotics" },
    { name: "Sara Patel", focusArea: "HealthTech, AI" },
  ];

  return ok({ investors });
}
