"use client";

import { useMemo, useState } from "react";
import InvestorCard from "@/components/investors/InvestorCard";
import { apiRequest } from "@/lib/apiClient";

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const add = (type, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };
  const Toasts = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded-md shadow-md text-white ${
            t.type === "error"
              ? "bg-red-500"
              : t.type === "success"
              ? "bg-emerald-500"
              : "bg-slate-800"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
  return { add, Toasts };
}

function normalizeInvestor(investor) {
  const id = investor?._id || investor?.id || investor?.userId;
  const name =
    investor?.name || investor?.full_name || investor?.fullName || "Investor";
  const title = investor?.title || investor?.role || investor?.position || "";
  const industry =
    investor?.industry ||
    investor?.sector ||
    (Array.isArray(investor?.industries) ? investor.industries[0] : "") ||
    (Array.isArray(investor?.sectors) ? investor.sectors[0] : "");
  const bio =
    investor?.bio ||
    investor?.description ||
    investor?.shortBio ||
    investor?.about ||
    "";
  const photo =
    investor?.profilePhoto ||
    investor?.avatar ||
    investor?.photoUrl ||
    investor?.image ||
    "";
  return {
    id,
    name,
    title,
    industry,
    bio,
    photo,
    raw: investor,
  };
}

export default function InvestorsList({ investors, error }) {
  const { add, Toasts } = useToasts();
  const [pendingIds, setPendingIds] = useState({});

  const normalized = useMemo(() => {
    if (!Array.isArray(investors)) return [];
    return investors.map(normalizeInvestor);
  }, [investors]);

  async function handleConnect(investor) {
    if (!investor?.id) {
      add("error", "Unable to send request. Missing investor ID.");
      return;
    }

    setPendingIds((prev) => ({ ...prev, [investor.id]: true }));
    try {
      const payload = {
        toUserId: investor.id,
        startupId: investor.raw?.startupId || "",
        roundType: "",
        shortPitch: "",
      };

      await apiRequest("connections", {
        method: "POST",
        data: {
          ...payload,
          shortPitch:
            payload.shortPitch || "Interested in connecting to learn more.",
        },
      });

      add("success", "Connection request sent successfully");
    } catch (err) {
      add("error", err?.message || "Connection request failed");
    } finally {
      setPendingIds((prev) => ({ ...prev, [investor.id]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Toasts />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
            Investors
          </div>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
            Meet investors who move fast
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">
            Build connections with investors aligned to your sector, stage, and
            momentum.
          </p>
        </div>

        {error ? (
          <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {normalized.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border border-slate-700 bg-slate-900" />
            <p className="text-lg font-medium text-white">
              No investors found yet — check back later
            </p>
            <p className="mt-2 text-sm text-slate-400">
              We&apos;re continuously expanding the network.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {normalized.map((investor) => (
              <InvestorCard
                key={investor.id}
                investor={investor}
                onConnect={() => handleConnect(investor)}
                connecting={Boolean(pendingIds[investor.id])}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
