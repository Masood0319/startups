import clientPromise, { getDb } from "./mongodb";

// Centralized collection accessors with basic indexes
export async function getInvestorsCollection() {
  const db = await getDb();
  const col = db.collection("investors");
  await col.createIndex({ userId: 1 }, { unique: true, sparse: true });
  await col.createIndex({ email: 1 }, { unique: true, sparse: true });
  return col;
}

export async function getStartupsCollection() {
  const db = await getDb();
  const col = db.collection("startups");
  await col.createIndex({ name: 1 });
  await col.createIndex({ industry: 1 });
  return col;
}

export async function getInvestmentsCollection() {
  const db = await getDb();
  const col = db.collection("investments");
  await col.createIndex({ investorId: 1 });
  await col.createIndex({ startupId: 1 });
  await col.createIndex({ type: 1, status: 1 });
  await col.createIndex({ createdAt: -1 });
  return col;
}

export async function getContractsCollection() {
  const db = await getDb();
  const col = db.collection("contracts");
  await col.createIndex({ startupId: 1 });
  await col.createIndex({ investorId: 1 });
  await col.createIndex({ type: 1, status: 1 });
  await col.createIndex({ createdAt: -1 });
  return col;
}

export const HARAM_INDUSTRIES = [
  "alcohol",
  "gambling",
  "pork",
  "adult",
  "tobacco",
  "conventional_finance_interest",
  "cannabis_non_medicinal",
];

export function hasProhibitedTerms(terms = {}) {
  // Ensure no fixed-interest or guaranteed returns
  const forbiddenKeys = ["interest", "interestRate", "guaranteedReturn", "fixedReturn", "apr"];
  for (const k of forbiddenKeys) {
    if (terms[k] != null) return true;
  }
  // String scan
  const json = JSON.stringify(terms).toLowerCase();
  if (json.includes("interest")) return true;
  if (json.includes("fixed return")) return true;
  if (json.includes("guaranteed")) return true;
  return false;
}

export function normalizeType(type) {
  const t = String(type || "").toLowerCase();
  switch (t) {
    case "equity":
    case "musharakah":
      return "equity"; // Musharakah
    case "profit-sharing":
    case "mudarabah":
      return "profit-sharing"; // Mudarabah
    case "safe":
    case "convertible":
      return "safe"; // Convertible SAFE-style
    case "revenue":
    case "revenue-sharing":
      return "revenue-sharing";
    case "crowdfunding":
    case "pool":
      return "crowdfunding";
    default:
      return t;
  }
}

export function buildAgreementPreview({ type, amount, investor, startup, terms }) {
  const t = normalizeType(type);
  const currency = terms?.currency || "USD";
  const lines = [];
  lines.push(`Investment Agreement - ${t.toUpperCase()}`);
  lines.push(`Investor: ${investor?.name || investor?.email || investor?.id || "N/A"}`);
  lines.push(`Startup: ${startup?.name || startup?.id || "N/A"}`);
  lines.push(`Amount: ${currency} ${amount}`);
  switch (t) {
    case "equity":
      lines.push(`Equity Percentage: ${terms?.equityPercent ?? "-"}%`);
      lines.push(`Valuation Cap: ${terms?.valuationCap ?? "-"}`);
      break;
    case "profit-sharing":
      lines.push(`Profit Ratio (Investor:Startup): ${terms?.profitRatioInvestor ?? "-"}:${terms?.profitRatioStartup ?? "-"}`);
      lines.push(`Losses borne by Capital Provider only per Mudarabah principles.`);
      break;
    case "safe":
      lines.push(`Conversion: ${terms?.conversion ?? "standard"}`);
      lines.push(`Valuation Cap: ${terms?.valuationCap ?? "-"}`);
      lines.push(`Discount: ${terms?.discount ?? 0}%`);
      break;
    case "revenue-sharing":
      lines.push(`Revenue Share: ${terms?.revenueSharePercent ?? "-"}% of gross revenue until ${terms?.returnCapMultiple ?? "-"}x is repaid.`);
      break;
    case "crowdfunding":
      lines.push(`Pool Terms: ${terms?.poolTerms ?? "-"}`);
      lines.push(`Minimum Ticket: ${terms?.minTicket ?? "-"}`);
      break;
    default:
      lines.push(`Custom terms apply.`);
  }
  lines.push("This document is a non-binding preview for review and compliance only.");
  return lines.join("\n");
}
