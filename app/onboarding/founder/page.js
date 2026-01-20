"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const LOCAL_KEY = "onboarding_draft_v1";

const defaultState = {
  companyName: "",
  industry: "",
  website: "",
  location: "",
  founderName: "",
  founderEmail: "",
  linkedin: "",
  shortBio: "",
  stage: "pre-seed",
  valuation: "",
  targetAmount: "",
  equityOffered: "",
  minInvestment: "",
  logoFile: null,
  pitchDeckFile: null,
  agreeTerms: false,
};

export default function FounderOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState(defaultState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ stable change handler
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  }, []);

  const handleFile = (e) => {
    const { name, files } = e.target;
    if (!files || files.length === 0) return;
    const file = files[0];
    setData((d) => ({ ...d, [name]: file }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  };

  // ✅ Load draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) setData((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  // ✅ Save draft
  useEffect(() => {
    const toSave = { ...data };
    if (toSave.logoFile instanceof File) {
      toSave.logoFileName = toSave.logoFile.name;
      toSave.logoFile = null;
    }
    if (toSave.pitchDeckFile instanceof File) {
      toSave.pitchDeckFileName = toSave.pitchDeckFile.name;
      toSave.pitchDeckFile = null;
    }
    localStorage.setItem(LOCAL_KEY, JSON.stringify(toSave));
  }, [data]);

  function validateCurrentStep() {
    const e = {};
    if (step === 1) {
      if (!data.companyName.trim()) e.companyName = "Company name is required";
      if (!data.industry.trim()) e.industry = "Industry is required";
    }
    if (step === 2) {
      if (!data.founderName.trim()) e.founderName = "Founder name is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.founderEmail))
        e.founderEmail = "Valid email is required";
    }
    if (step === 3) {
      if (!data.targetAmount || Number(data.targetAmount) <= 0)
        e.targetAmount = "Funding goal is required";
      if (
        !data.equityOffered ||
        Number(data.equityOffered) <= 0 ||
        Number(data.equityOffered) > 100
      )
        e.equityOffered = "Equity must be between 0 and 100";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const next = () => {
    if (!validateCurrentStep()) return;
    setStep((s) => Math.min(5, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    if (!data.agreeTerms) {
      setErrors((e) => ({ ...e, agreeTerms: "You must agree to the terms" }));
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const form = new FormData();
      const payload = { ...data };
      delete payload.logoFile;
      delete payload.pitchDeckFile;
      form.append(
        "payload",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );

      if (data.logoFile instanceof File) form.append("logo", data.logoFile);
      if (data.pitchDeckFile instanceof File)
        form.append("pitch", data.pitchDeckFile);

      const res = await fetch("/api/startups", {
        method: "POST",
        body: form,
      });
      const resJson = await res.json();

      if (!res.ok) throw new Error(resJson.message || "Submission failed");

      setMessage("Startup submitted successfully!");
      localStorage.removeItem(LOCAL_KEY);
      setTimeout(() => {
        setLoading(false);
        router.push("/dashboard/founder");
      }, 800);
    } catch (err) {
      setMessage(err.message || "Server error. Try again later.");
      setLoading(false);
    }
  };

  const progressPct = Math.round(((step - 1) / 4) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-6 text-white">
      <div className="mx-auto max-w-4xl bg-gray-950 rounded-2xl shadow-lg px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent">
            Founder Onboarding
          </h1>
          <div className="text-sm text-gray-400">Step {step} of 5</div>
        </div>

        {/* progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-700 rounded">
            <div
              className="h-2 bg-gradient-to-r from-indigo-500 to-pink-500 rounded transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-400">{progressPct}% complete</div>
        </div>

        {/* step 1 - company info */}
        {step === 1 && (
          <section className="mt-6">
            <h2 className="text-xl font-semibold">Basic company info</h2>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <input
                name="companyName"
                value={data.companyName}
                onChange={handleChange}
                placeholder="Company name"
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600"
              />
              <input
                name="industry"
                value={data.industry}
                onChange={handleChange}
                placeholder="Industry"
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600"
              />
              <input
                name="website"
                value={data.website}
                onChange={handleChange}
                placeholder="Website"
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600"
              />
              <input
                name="location"
                value={data.location}
                onChange={handleChange}
                placeholder="Location"
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600"
              />
            </div>
          </section>
        )}

        {/* step 2 - founder info */}
        {step === 2 && (
          <section className="mt-6">
            <h2 className="text-xl font-semibold">Founder details</h2>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <input
                name="founderName"
                value={data.founderName}
                onChange={handleChange}
                placeholder="Founder name"
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600"
              />
              <input
                name="founderEmail"
                value={data.founderEmail}
                onChange={handleChange}
                placeholder="Founder email"
                type="email"
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600"
              />
              <input
                name="linkedin"
                value={data.linkedin}
                onChange={handleChange}
                placeholder="LinkedIn profile"
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600"
              />
              <textarea
                name="shortBio"
                value={data.shortBio}
                onChange={handleChange}
                placeholder="Short bio"
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600"
              />
            </div>
          </section>
        )}

        {/* step 3 - funding info */}
        {step === 3 && (
          <section className="mt-6">
            <h2 className="text-xl font-semibold">Funding details</h2>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <select
                name="stage"
                value={data.stage}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600"
              >
                <option value="pre-seed">Pre-seed</option>
                <option value="seed">Seed</option>
                <option value="series-a">Series A</option>
                <option value="series-b">Series B</option>
              </select>
              <input
                name="valuation"
                value={data.valuation}
                onChange={handleChange}
                placeholder="Valuation"
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600"
              />
              <input
                name="targetAmount"
                value={data.targetAmount}
                onChange={handleChange}
                placeholder="Target funding amount"
                type="number"
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600"
              />
              <input
                name="equityOffered"
                value={data.equityOffered}
                onChange={handleChange}
                placeholder="Equity offered (%)"
                type="number"
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600"
              />
              <input
                name="minInvestment"
                value={data.minInvestment}
                onChange={handleChange}
                placeholder="Minimum investment"
                type="number"
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600"
              />
            </div>
          </section>
        )}

        {/* step 4 - uploads */}
        {step === 4 && (
          <section className="mt-6">
            <h2 className="text-xl font-semibold">Upload docs</h2>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <input
                type="file"
                name="logoFile"
                onChange={handleFile}
                className="w-full text-sm text-gray-300"
              />
              <input
                type="file"
                name="pitchDeckFile"
                onChange={handleFile}
                className="w-full text-sm text-gray-300"
              />
            </div>
          </section>
        )}

        {/* step 5 - review */}
        {step === 5 && (
          <section className="mt-6">
            <h2 className="text-xl font-semibold">Review & submit</h2>
            <p className="text-gray-400 text-sm mb-4">
              Please confirm your details before submitting.
            </p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={data.agreeTerms}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span>I agree to the terms and conditions</span>
            </label>
          </section>
        )}

        {/* navigation */}
        <div className="mt-6 flex items-center justify-between">
          {step > 1 && (
            <button
              onClick={back}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
            >
              Back
            </button>
          )}
          {step < 5 && (
            <button
              onClick={next}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm"
            >
              Next
            </button>
          )}
          {step === 5 && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm"
            >
              {loading ? "Submitting..." : "Submit startup"}
            </button>
          )}
        </div>

        {message && (
          <div className="mt-4 p-3 rounded bg-green-900/50 text-green-300 text-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}