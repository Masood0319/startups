"use client";

import { useEffect, useMemo, useState } from "react";

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
            t.type === "error" ? "bg-red-500" : t.type === "success" ? "bg-green-600" : "bg-gray-800"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
  return { add, Toasts };
}

export default function DashboardStartupsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { add, Toasts } = useToasts();

  const emptyForm = useMemo(
    () => ({
      companyName: "",
      industry: "",
      stage: "",
      valuation: "",
      targetAmount: "",
      equityOffered: "",
      minInvestment: "",
      website: "",
      location: "",
      shortBio: "",
    }),
    []
  );
  const [form, setForm] = useState(emptyForm);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch("/api/startups", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch");
      setList(data);
    } catch (e) {
      add("error", e.message || "Failed to load startups");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/startups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || "Create failed");
      add("success", "Startup created");
      setForm(emptyForm);
      fetchList();
    } catch (e) {
      add("error", e.message || "Create failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this startup?")) return;
    try {
      const res = await fetch(`/api/startups/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || "Delete failed");
      add("success", "Deleted");
      setList((prev) => prev.filter((x) => x._id !== id));
    } catch (e) {
      add("error", e.message || "Delete failed");
    }
  }

  function startEdit(item) {
    setEditingId(item._id);
    setForm({
      companyName: item.companyName || "",
      industry: item.industry || "",
      stage: item.stage || "",
      valuation: item.valuation || "",
      targetAmount: item.targetAmount || "",
      equityOffered: item.equityOffered || "",
      minInvestment: item.minInvestment || "",
      website: item.website || "",
      location: item.location || "",
      shortBio: item.shortBio || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submitEdit() {
    try {
      const res = await fetch(`/api/startups/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || "Update failed");
      add("success", "Updated");
      setEditingId(null);
      setForm(emptyForm);
      fetchList();
    } catch (e) {
      add("error", e.message || "Update failed");
    }
  }

  return (
    <div className="p-6">
      <Toasts />

      <h1 className="text-2xl font-semibold mb-6">Startups</h1>

      {/* Create / Edit Card */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-8 border">
        <h2 className="text-lg font-medium mb-4">{editingId ? "Edit Startup" : "Create New Startup"}</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="border rounded-md px-3 py-2" placeholder="Company Name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          <input className="border rounded-md px-3 py-2" placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          <input className="border rounded-md px-3 py-2" placeholder="Stage" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} />
          <input className="border rounded-md px-3 py-2" placeholder="Valuation" value={form.valuation} onChange={(e) => setForm({ ...form, valuation: e.target.value })} />
          <input className="border rounded-md px-3 py-2" placeholder="Target Amount" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
          <input className="border rounded-md px-3 py-2" placeholder="Equity Offered (%)" value={form.equityOffered} onChange={(e) => setForm({ ...form, equityOffered: e.target.value })} />
          <input className="border rounded-md px-3 py-2" placeholder="Min. Investment" value={form.minInvestment} onChange={(e) => setForm({ ...form, minInvestment: e.target.value })} />
          <input className="border rounded-md px-3 py-2" placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <input className="border rounded-md px-3 py-2" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <textarea className="md:col-span-2 border rounded-md px-3 py-2" placeholder="Short Bio" rows={3} value={form.shortBio} onChange={(e) => setForm({ ...form, shortBio: e.target.value })} />

          {!editingId ? (
            <div className="md:col-span-2 flex gap-3">
              <button disabled={submitting} className="px-4 py-2 rounded-md bg-indigo-600 text-white shadow hover:bg-indigo-700 disabled:opacity-60" type="submit">
                {submitting ? "Saving..." : "Create"}
              </button>
            </div>
          ) : (
            <div className="md:col-span-2 flex gap-3">
              <button type="button" onClick={submitEdit} className="px-4 py-2 rounded-md bg-green-600 text-white shadow hover:bg-green-700">
                Save Changes
              </button>
              <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 shadow hover:bg-gray-300">
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : list.length === 0 ? (
          <div className="text-gray-600">No startups found.</div>
        ) : (
          list.map((s) => (
            <div key={s._id} className="bg-white rounded-xl shadow-sm p-5 border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{s.companyName || "Untitled"}</h3>
                  <p className="text-sm text-gray-600">{s.industry}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(s)} className="px-3 py-1 rounded-md bg-amber-500 text-white hover:bg-amber-600">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(s._id)} className="px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600">
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-700 space-y-1">
                {s.stage && <div><strong>Stage:</strong> {s.stage}</div>}
                {s.valuation && <div><strong>Valuation:</strong> {s.valuation}</div>}
                {s.targetAmount && <div><strong>Target:</strong> {s.targetAmount}</div>}
                {s.equityOffered && <div><strong>Equity:</strong> {s.equityOffered}%</div>}
                {s.minInvestment && <div><strong>Min Inv:</strong> {s.minInvestment}</div>}
                {s.website && (
                  <div>
                    <a href={s.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                      {s.website}
                    </a>
                  </div>
                )}
                {s.location && <div>{s.location}</div>}
                {s.shortBio && <p className="text-gray-600 italic">{s.shortBio}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
