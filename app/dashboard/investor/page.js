"use client";

import { useEffect, useMemo, useState } from "react";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startups, setStartups] = useState([]);
  const [filters, setFilters] = useState({
    industry: "",
    geography: "",
    min: "",
    max: "",
  });

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.industry) p.set("industry", filters.industry);
    if (filters.geography) p.set("geography", filters.geography);
    if (filters.min) p.set("min", filters.min);
    if (filters.max) p.set("max", filters.max);
    return p.toString();
  }, [filters]);

  const fetchStartups = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/startups${qs ? `?${qs}` : ""}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load startups");
      // API returns either array or {startups}
      const arr = Array.isArray(data) ? data : data.startups || [];
      setStartups(arr);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Investor Dashboard</h1>

      {/* Filters */}
      <div className="bg-black/20 border border-white/10 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            value={filters.industry}
            onChange={(e) => setFilters((f) => ({ ...f, industry: e.target.value }))}
            placeholder="Industry"
            className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
          />
          <input
            value={filters.geography}
            onChange={(e) => setFilters((f) => ({ ...f, geography: e.target.value }))}
            placeholder="Geography"
            className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
          />
          <input
            value={filters.min}
            onChange={(e) => setFilters((f) => ({ ...f, min: e.target.value }))}
            type="number"
            placeholder="Min Investment ($)"
            className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
          />
          <input
            value={filters.max}
            onChange={(e) => setFilters((f) => ({ ...f, max: e.target.value }))}
            type="number"
            placeholder="Max Investment ($)"
            className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
          />
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={fetchStartups} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Apply Filters</button>
          <button
            onClick={() => { setFilters({ industry: "", geography: "", min: "", max: "" }); setTimeout(fetchStartups, 0); }}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results */}
      {loading && <p className="text-gray-300">Loading...</p>}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {startups.map((s, idx) => (
            <div key={s._id || idx} className="rounded-lg border border-white/10 bg-black/20 p-4 hover:bg-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{s.name || "Untitled Startup"}</h3>
                {s.logo && <img src={s.logo} alt={s.name} className="h-10 w-10 rounded object-cover border border-white/10" />}
              </div>
              <p className="mt-2 text-sm text-gray-300">{s.description || "No description provided."}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-400">
                <div><span className="opacity-70">Industry:</span> {s.industry || "N/A"}</div>
                <div><span className="opacity-70">Geo:</span> {s.geography || s.location || "N/A"}</div>
                <div><span className="opacity-70">Min:</span> ${s.minInvestment || s.min || "-"}</div>
                <div><span className="opacity-70">Max:</span> ${s.maxInvestment || s.max || "-"}</div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500">View</button>
                
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
