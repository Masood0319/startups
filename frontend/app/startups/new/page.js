"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";

export default function Page() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    founderName: "",
    founderEmail: "",
    linkedin: "",
    stage: "",
    valuation: "",
    targetAmount: "",
    equityOffered: "",
    minInvestment: "",
    website: "",
    location: "",
    shortBio: "",
    logo: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      if (!form.companyName) throw new Error("Company name is required");
      const data = await apiRequest("startups", {
        method: "POST",
        data: form,
      });
      if (!data?.data?.id) throw new Error("Server did not return new id");
      setMessage({ type: "success", text: "Startup created. Redirecting..." });
      setTimeout(() => router.push(`/startups/${data.data.id}`), 700);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Create failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Add New Startup</h1>
          <Link href="/startups" className="text-indigo-600 hover:underline">← Back to all startups</Link>
        </div>

        {message && (
          <div className={`mb-4 rounded-md px-4 py-3 ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input name="companyName" value={form.companyName} onChange={onChange} required className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Industry</label>
              <input name="industry" value={form.industry} onChange={onChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Founder Name</label>
              <input name="founderName" value={form.founderName} onChange={onChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Founder Email</label>
              <input type="email" name="founderEmail" value={form.founderEmail} onChange={onChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
              <input name="linkedin" value={form.linkedin} onChange={onChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stage</label>
              <input name="stage" value={form.stage} onChange={onChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Valuation</label>
              <input name="valuation" value={form.valuation} onChange={onChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Target Amount</label>
              <input type="number" name="targetAmount" value={form.targetAmount} onChange={onChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Equity Offered (%)</label>
              <input type="number" name="equityOffered" value={form.equityOffered} onChange={onChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Min. Investment</label>
              <input type="number" name="minInvestment" value={form.minInvestment} onChange={onChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input name="website" value={form.website} onChange={onChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input name="location" value={form.location} onChange={onChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Short Bio</label>
              <textarea name="shortBio" value={form.shortBio} onChange={onChange} rows={3} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Logo URL</label>
              <input name="logo" value={form.logo} onChange={onChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60">
              {submitting ? "Creating..." : "+ Create Startup"}
            </button>
            <Link href="/startups" className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
