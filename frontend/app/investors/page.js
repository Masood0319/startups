import { Suspense } from "react";
import { cookies } from "next/headers";
import InvestorsList from "@/components/investors/InvestorsList";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function LoadingState() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
        </div>
      </div>
    </div>
  );
}

async function InvestorsContent() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");

    const res = await fetch(`${API_BASE}/api/investors`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.success) {
      const message = data?.message || data?.error || "Failed to load investors";
      return <InvestorsList investors={[]} error={message} />;
    }

    const investors = data?.data?.investors || [];
    return <InvestorsList investors={investors} error={""} />;
  } catch (err) {
    return (
      <InvestorsList
        investors={[]}
        error={err?.message || "Unable to load investors right now"}
      />
    );
  }
}

export default function InvestorsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <InvestorsContent />
    </Suspense>
  );
}
