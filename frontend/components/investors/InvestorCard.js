"use client";

export default function InvestorCard({ investor, onConnect, connecting }) {
  const initials = investor?.name
    ? investor.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "IN";

  return (
    <div className="group flex h-full flex-col rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.4)] transition hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_20px_60px_-30px_rgba(6,182,212,0.7)]">
      <div className="flex items-start gap-4">
        {investor.photo ? (
          <img
            src={investor.photo}
            alt={investor.name}
            className="h-14 w-14 rounded-2xl object-cover ring-2 ring-cyan-400/30"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 via-slate-800 to-indigo-500/30 text-lg font-semibold text-cyan-100 ring-2 ring-cyan-400/30">
            {initials}
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white">{investor.name}</h3>
          <p className="mt-1 text-sm text-slate-300">
            {investor.title || "Investor"}
          </p>
          {investor.industry ? (
            <span className="mt-3 inline-flex items-center rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-medium text-cyan-200">
              {investor.industry}
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-5 text-sm text-slate-300 line-clamp-4">
        {investor.bio ||
          "Focused on building long-term partnerships with ambitious founders."}
      </p>

      <div className="mt-6">
        <button
          onClick={onConnect}
          disabled={connecting}
          className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
        >
          {connecting ? "Sending..." : "Connect"}
        </button>
      </div>
    </div>
  );
}
