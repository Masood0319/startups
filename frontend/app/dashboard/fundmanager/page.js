"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";

export default function Page() {
  const [stats, setStats] = useState(null);
  const [portfolio, setPortfolio] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, portfolioData] = await Promise.all([
          apiRequest("dashboard?role=fundmanager", { method: "GET" }),
          apiRequest("funds/portfolio", { method: "GET" }),
        ]);
        setStats(statsData?.data || null);
        setPortfolio(portfolioData?.data?.startups || []);
      } catch {
        setStats(null);
        setPortfolio([]);
      }
    };
    load();
  }, []);

  if (!stats) return <p className="p-6">Loading dashboard...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Fund Manager Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold">Total Funds</h2>
          <p className="text-2xl font-bold text-blue-600">{stats?.stats?.total || 0}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold">Active Investments</h2>
          <p className="text-2xl font-bold text-green-600">{stats?.stats?.accepted || 0}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold">Pending Deals</h2>
          <p className="text-2xl font-bold text-yellow-600">{stats?.stats?.pending || 0}</p>
        </div>
      </div>

      {/* Portfolio */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">Your Portfolio Startups</h2>
        <table className="w-full border rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3">Startup</th>
              <th className="text-left p-3">Sector</th>
              <th className="text-left p-3">Investment</th>
              <th className="text-left p-3">Stage</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((startup, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">{startup.name}</td>
                <td className="p-3">{startup.sector}</td>
                <td className="p-3">${startup.investment}</td>
                <td className="p-3">{startup.stage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
