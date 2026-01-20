"use client";

import { useState } from "react";
import AgreementPreview from "@/app/components/AgreementPreview";

const TYPES = [
  { value: "equity", label: "Equity (Musharakah)" },
  { value: "profit-sharing", label: "Profit-Sharing (Mudarabah)" },
  { value: "safe", label: "Convertible SAFE" },
  { value: "revenue-sharing", label: "Revenue Sharing" },
  { value: "crowdfunding", label: "Crowdfunding Pool" },
];

async function parseJsonSafe(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json();
  const text = await res.text();
  return { success: false, message: text?.slice(0, 500) || "Unexpected non-JSON response" };
}

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form, setForm] = useState({
    // Assume startup selects which of their startupId to raise for; in simplest case, slug read elsewhere.
    startupId: "",
    type: "equity",
    amount: "",
    terms: { currency: "USD" },
  });

  const renderTermsFields = () => {
    switch (form.type) {
      case "equity":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="number" placeholder="Equity % offered"
              value={form.terms.equityPercent || ""}
              onChange={(e) => setForm((f) => ({ ...f, terms: { ...f.terms, equityPercent: Number(e.target.value) } }))}
              className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500" />
            <input placeholder="Valuation Cap (optional)"
              value={form.terms.valuationCap || ""}
              onChange={(e) => setForm((f) => ({ ...f, terms: { ...f.terms, valuationCap: e.target.value } }))}
              className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500" />
          </div>
        );
      case "profit-sharing":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="number" placeholder="Investor Profit Ratio"
              value={form.terms.profitRatioInvestor || ""}
              onChange={(e) => setForm((f) => ({ ...f, terms: { ...f.terms, profitRatioInvestor: Number(e.target.value) } }))}
              className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500" />
            <input type="number" placeholder="Startup Profit Ratio"
              value={form.terms.profitRatioStartup || ""}
              onChange={(e) => setForm((f) => ({ ...f, terms: { ...f.terms, profitRatioStartup: Number(e.target.value) } }))}
              className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500" />
          </div>
        );
      case "safe":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input placeholder="Conversion (e.g., standard)"
              value={form.terms.conversion || ""}
              onChange={(e) => setForm((f) => ({ ...f, terms: { ...f.terms, conversion: e.target.value } }))}
              className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500" />
            <input placeholder="Valuation Cap"
              value={form.terms.valuationCap || ""}
              onChange={(e) => setForm((f) => ({ ...f, terms: { ...f.terms, valuationCap: e.target.value } }))}
              className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500" />
            <input type="number" placeholder="Discount %"
              value={form.terms.discount || ""}
              onChange={(e) => setForm((f) => ({ ...f, terms: { ...f.terms, discount: Number(e.target.value) } }))}
              className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500" />
          </div>
        );
      case "revenue-sharing":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="number" placeholder="Revenue Share %"
              value={form.terms.revenueSharePercent || ""}
              onChange={(e) => setForm((f) => ({ ...f, terms: { ...f.terms, revenueSharePercent: Number(e.target.value) } }))}
              className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500" />
            <input type="number" placeholder="Return Cap Multiple (e.g., 2 for 2x)"
              value={form.terms.returnCapMultiple || ""}
              onChange={(e) => setForm((f) => ({ ...f, terms: { ...f.terms, returnCapMultiple: Number(e.target.value) } }))}
              className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500" />
          </div>
        );
      case "crowdfunding":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Pool Terms"
              value={form.terms.poolTerms || ""}
              onChange={(e) => setForm((f) => ({ ...f, terms: { ...f.terms, poolTerms: e.target.value } }))}
              className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500" />
            <input type="number" placeholder="Minimum Ticket"
              value={form.terms.minTicket || ""}
              onChange={(e) => setForm((f) => ({ ...f, terms: { ...f.terms, minTicket: Number(e.target.value) } }))}
              className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500" />
          </div>
        );
      default:
        return null;
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/investments/${form.type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok || !data.success) throw new Error(data?.errors?.join("; ") || data?.message || `HTTP ${res.status}`);
      alert("Fundraising contract created and marked as seeking.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Raise Funding</h1>
      {error && <p className="text-red-400 mb-4">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Startup ID</label>
            <input value={form.startupId} onChange={(e) => setForm((f) => ({ ...f, startupId: e.target.value }))}
              placeholder="Enter your startup ID"
              className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 -outline-offset-1 outline-white/10" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 -outline-offset-1 outline-white/10">
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Target Amount</label>
            <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
              className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 -outline-offset-1 outline-white/10" required />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Currency</label>
            <input value={form.terms.currency || ""} onChange={(e) => setForm((f) => ({ ...f, terms: { ...f.terms, currency: e.target.value } }))}
              className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 -outline-offset-1 outline-white/10" />
          </div>
        </div>

        <div className="mt-2">
          <h3 className="text-sm font-semibold text-white/80 mb-2">Terms</h3>
          {renderTermsFields()}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => setPreviewOpen(true)} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">Preview Agreement</button>
          <button disabled={loading} type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60">
            {loading ? "Submitting..." : "Create Raise"}
          </button>
        </div>
      </form>

      <AgreementPreview open={previewOpen} onClose={() => setPreviewOpen(false)} data={{
        type: form.type,
        amount: form.amount,
        startup: { id: form.startupId },
        terms: form.terms,
      }} />
    </div>
  );
}
