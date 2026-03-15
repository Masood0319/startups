"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";

export default function Page() {
  const { id } = useParams();
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Normalize possible ObjectId representations to string
  const normalizeId = (v) => (typeof v === "object" && v !== null ? v?.$oid || v?.toString?.() : v);

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        setError(null);
        const data = await apiRequest(`startups/${id}`, { method: "GET" });
        setStartup(data?.data?.startup || null);
      } catch (err) {
        console.error("Error fetching startup:", err);
        setError(err.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchStartup();
  }, [id]);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const me = await apiRequest("auth/me", { method: "GET", cache: "no-store" });
        setCurrentUser(me?.data?.user || null);
      } catch (e) {
        // ignore
      }
    };
    fetchMe();
  }, []);

  const isOwner = useMemo(() => {
    if (!startup || !currentUser) return false;
    const ownerId = normalizeId(startup.userId) || normalizeId(startup.ownerId);
    const meId = normalizeId(currentUser?.id) || normalizeId(currentUser?.userId) || normalizeId(currentUser?._id);
    // Fallback: match by email when id not available on one side
    const emailMatch = currentUser?.email && startup?.founderEmail && currentUser.email === startup.founderEmail;
    return (ownerId && meId && ownerId === meId) || emailMatch;
  }, [startup, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-600">
        Loading startup...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-center px-6">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/startups" className="text-indigo-600 hover:underline">
          ← Back to all startups
        </Link>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-center px-6 text-gray-600">
        Startup not found.
        <Link href="/startups" className="mt-3 text-indigo-600 hover:underline">
          ← Back to all startups
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/startups" className="text-indigo-600 hover:underline">
            ← Back to all startups
          </Link>
          {isOwner && (
            <Link
              href={`/dashboard/startups/edit/${normalizeId(startup._id)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              Edit Startup
            </Link>
          )}
        </div>

        {/* Logo */}
        {startup.logo && (
          <img
            src={startup.logo}
            alt={startup.companyName}
            className="w-32 h-32 mx-auto mb-6 rounded-full border object-cover"
          />
        )}

        {/* Company Name */}
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
          {startup.companyName}
        </h1>

        {/* Industry */}
        {startup.industry && (
          <p className="text-center text-indigo-700 font-medium mb-4">
            {startup.industry}
          </p>
        )}

        {/* Short bio */}
        {startup.shortBio && (
          <p className="text-gray-700 text-lg mb-8 text-center">{startup.shortBio}</p>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Founder Info */}
          {(startup.founderName || startup.founderEmail || startup.linkedin) && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Founder</h3>
              {startup.founderName && (
                <p className="text-gray-700"><span className="font-medium">Name:</span> {startup.founderName}</p>
              )}
              {startup.founderEmail && (
                <p className="text-gray-700"><span className="font-medium">Email:</span> {startup.founderEmail}</p>
              )}
              {startup.linkedin && (
                <p className="text-gray-700">
                  <span className="font-medium">LinkedIn:</span>{" "}
                  <a href={startup.linkedin} target="_blank" className="text-indigo-600 hover:underline">Profile</a>
                </p>
              )}
            </div>
          )}

          {/* Funding details */}
          {(startup.stage || startup.valuation || startup.targetAmount || startup.equityOffered || startup.minInvestment) && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Funding</h3>
              {startup.stage && (
                <p className="text-gray-700"><span className="font-medium">Stage:</span> {startup.stage}</p>
              )}
              {startup.valuation && (
                <p className="text-gray-700"><span className="font-medium">Valuation:</span> {startup.valuation}</p>
              )}
              {startup.targetAmount && (
                <p className="text-gray-700"><span className="font-medium">Target:</span> ${startup.targetAmount}</p>
              )}
              {startup.equityOffered && (
                <p className="text-gray-700"><span className="font-medium">Equity:</span> {startup.equityOffered}%</p>
              )}
              {startup.minInvestment && (
                <p className="text-gray-700"><span className="font-medium">Min. Investment:</span> ${startup.minInvestment}</p>
              )}
            </div>
          )}

          {/* Website */}
          {startup.website && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Website</h3>
              <a href={startup.website} target="_blank" className="text-indigo-600 hover:underline">
                {startup.website}
              </a>
            </div>
          )}

          {/* Location */}
          {startup.location && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Location</h3>
              <p className="text-gray-700">{startup.location}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
