"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "../components/navbar";

export default function Page() {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStartups = async () => {
      try {
        const res = await fetch("/api/startups");
        const data = await res.json();
        setStartups(data);
      } catch (error) {
        console.error("Error fetching startups:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStartups();
  }, []);

  const openExternal = (e, url) => {
    e.stopPropagation();
    e.preventDefault();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
    <Navbar/>
    <div
      className="min-h-screen bg-cover backdrop-blur-md bg-center bg-no-repeat py-12 px-6"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0.6,0.6,0.65), rgba(0,0,0.6,0.65)), url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80')",
      }}
    >
      
      {/* Page Header */}
      <header className="max-w-6xl mx-auto mb-10 text-center text-white">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg"
        >
          Listed Startups
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-gray-200 text-lg"
        >
          Browse innovative startups and emerging companies.
        </motion.p>
      </header>

      {/* Content */}
      {loading ? (
        <p className="text-center text-white">Loading startups...</p>
      ) : startups.length === 0 ? (
        <p className="text-center text-white">No startups listed yet.</p>
      ) : (
        <div className="max-w-6xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-y-auto">
          {startups.map((s, index) => (
            <Link key={s._id} href={`/startups/${s._id}`} className="block">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="w-full p-5 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl transition cursor-pointer"
              >
                {/* Logo */}
                {s.logo && (
                  <img
                    src={s.logo}
                    alt={s.companyName}
                    className="w-20 h-20 mx-auto mb-4 rounded-full border object-cover shadow"
                  />
                )}

                {/* Company info */}
                <h3 className="text-lg font-bold text-gray-900 text-center">
                  {s.companyName}
                </h3>
                <p className="text-sm text-gray-600 text-center">{s.industry}</p>

                {/* Founder */}
                <div className="mt-3 text-sm text-gray-700">
                  <strong>Founder:</strong> {s.founderName} <br />
                  <strong>Email:</strong> {s.founderEmail} <br />
                  {s.linkedin && (
                    <button
                      onClick={(e) => openExternal(e, s.linkedin)}
                      className="text-indigo-600 hover:underline"
                      aria-label="Open LinkedIn profile in new tab"
                    >
                      LinkedIn
                    </button>
                  )}
                </div>

                {/* Funding */}
                <div className="mt-3 text-sm text-gray-700">
                  <strong>Stage:</strong> {s.stage} <br />
                  <strong>Valuation:</strong> {s.valuation} <br />
                  <strong>Target:</strong> ${s.targetAmount} <br />
                  <strong>Equity:</strong> {s.equityOffered}% <br />
                  <strong>Min. Investment:</strong> ${s.minInvestment}
                </div>

                {/* Website & Location */}
                <div className="mt-3 text-sm text-gray-700">
                  {s.website && (
                    <button
                      onClick={(e) => openExternal(e, s.website)}
                      className="text-indigo-600 hover:underline"
                      aria-label="Open website in new tab"
                    >
                      🌐 {s.website}
                    </button>
                  )}
                  <p className="mt-1">{s.location}</p>
                </div>

                {/* Short Bio */}
                {s.shortBio && (
                  <p className="mt-3 text-sm text-gray-600 italic line-clamp-3">
                    “{s.shortBio}”
                  </p>
                )}
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
