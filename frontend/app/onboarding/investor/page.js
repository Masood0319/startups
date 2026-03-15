
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/apiClient";

const LOCAL_KEY = "investor_onboarding_draft_v1";

const defaultState = {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    bio: "",
    expertise: "",
    preferredStage: "pre-seed",
    minTicketSize: "",
    maxTicketSize: "",
    industries: "",
    idDocument: null,
    accreditation: null,
    agreeTerms: false,
};

export default function Page() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [data, setData] = useState(defaultState);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // ✅ change handler
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
        } catch { }
    }, []);

    // ✅ Save draft
    useEffect(() => {
        const toSave = { ...data };
        if (toSave.idDocument instanceof File) {
            toSave.idDocumentName = toSave.idDocument.name;
            toSave.idDocument = null;
        }
        if (toSave.accreditation instanceof File) {
            toSave.accreditationName = toSave.accreditation.name;
            toSave.accreditation = null;
        }
        localStorage.setItem(LOCAL_KEY, JSON.stringify(toSave));
    }, [data]);

    // ✅ validation
    function validateCurrentStep() {
        const e = {};
        if (step === 1) {
            if (!data.fullName.trim()) e.fullName = "Full name is required";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
                e.email = "Valid email is required";
            if (!data.phone.trim()) e.phone = "Phone number required";
        }
        if (step === 3) {
            if (!data.minTicketSize || Number(data.minTicketSize) <= 0)
                e.minTicketSize = "Minimum ticket size required";
            if (!data.maxTicketSize || Number(data.maxTicketSize) <= 0)
                e.maxTicketSize = "Maximum ticket size required";
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

    // ✅ submit
    const handleSubmit = async () => {
        if (!validateCurrentStep()) return;
        if (!data.agreeTerms) {
            setErrors((e) => ({ ...e, agreeTerms: "You must agree to the terms" }));
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const payload = {
                industries: data.industries
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                ticketSizeMin: Number(data.minTicketSize) || 0,
                ticketSizeMax: Number(data.maxTicketSize) || 0,
                bio: data.bio,
            };

            await apiRequest("investors", {
                method: "POST",
                data: payload,
            });

            // Success: clear draft and redirect
            localStorage.removeItem(LOCAL_KEY);
            router.replace("/dashboard/investor");
            return;
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
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-teal-500 bg-clip-text text-transparent">
                        Investor Onboarding
                    </h1>
                    <div className="text-sm text-gray-400">Step {step} of 5</div>
                </div>

                {/* progress bar */}
                <div className="mt-4">
                    <div className="h-2 bg-gray-700 rounded">
                        <div
                            className="h-2 bg-gradient-to-r from-green-500 to-teal-500 rounded transition-all"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <div className="mt-2 text-xs text-gray-400">{progressPct}% complete</div>
                </div>

                {/* Step 1 - Personal Info */}
                {step === 1 && (
                    <section className="mt-6 grid gap-4">
                        <input name="fullName" value={data.fullName} onChange={handleChange} placeholder="Full name" className="p-3 rounded bg-gray-800 border border-gray-600" />
                        <input name="email" value={data.email} onChange={handleChange} placeholder="Email" type="email" className="p-3 rounded bg-gray-800 border border-gray-600" />
                        <input name="phone" value={data.phone} onChange={handleChange} placeholder="Phone number" className="p-3 rounded bg-gray-800 border border-gray-600" />
                        <input name="location" value={data.location} onChange={handleChange} placeholder="Location" className="p-3 rounded bg-gray-800 border border-gray-600" />
                    </section>
                )}

                {/* Step 2 - Professional */}
                {step === 2 && (
                    <section className="mt-6 grid gap-4">
                        <input name="linkedin" value={data.linkedin} onChange={handleChange} placeholder="LinkedIn profile" className="p-3 rounded bg-gray-800 border border-gray-600" />
                        <textarea name="bio" value={data.bio} onChange={handleChange} placeholder="Short bio" className="p-3 rounded bg-gray-800 border border-gray-600" />
                        <input name="expertise" value={data.expertise} onChange={handleChange} placeholder="Industry expertise" className="p-3 rounded bg-gray-800 border border-gray-600" />
                    </section>
                )}

                {/* Step 3 - Preferences */}
                {step === 3 && (
                    <section className="mt-6 grid gap-4">
                        <select name="preferredStage" value={data.preferredStage} onChange={handleChange} className="p-3 rounded bg-gray-800 border border-gray-600">
                            <option value="pre-seed">Pre-seed</option>
                            <option value="seed">Seed</option>
                            <option value="series-a">Series A</option>
                            <option value="series-b">Series B</option>
                        </select>
                        <input name="minTicketSize" value={data.minTicketSize} onChange={handleChange} placeholder="Minimum ticket size" type="number" className="p-3 rounded bg-gray-800 border border-gray-600" />
                        <input name="maxTicketSize" value={data.maxTicketSize} onChange={handleChange} placeholder="Maximum ticket size" type="number" className="p-3 rounded bg-gray-800 border border-gray-600" />
                        <input name="industries" value={data.industries} onChange={handleChange} placeholder="Preferred industries" className="p-3 rounded bg-gray-800 border border-gray-600" />
                    </section>
                )}

                {/* Step 4 - Verification */}
                {step === 4 && (
                    <section className="mt-6 grid gap-4">
                        <input type="file" name="idDocument" onChange={handleFile} className="text-sm text-gray-300" />
                        <input type="file" name="accreditation" onChange={handleFile} className="text-sm text-gray-300" />
                    </section>
                )}

                {/* Step 5 - Review */}
                {step === 5 && (
                    <section className="mt-6">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" name="agreeTerms" checked={data.agreeTerms} onChange={handleChange} className="w-4 h-4" />
                            <span>I agree to the terms and conditions</span>
                        </label>
                    </section>
                )}

                {/* Navigation */}
                <div className="mt-6 flex items-center justify-between">
                    {step > 1 && (
                        <button onClick={back} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm">
                            Back
                        </button>
                    )}
                    {step < 5 && (
                        <button onClick={next} className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-sm">
                            Next
                        </button>
                    )}
                    {step === 5 && (
                        <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 rounded bg-teal-600 hover:bg-teal-500 text-sm">
                            {loading ? "Submitting..." : "Submit Investor Profile"}
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
