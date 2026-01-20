"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function StartupsShowcase() {
  const [startups, setStartups] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchStartups = async () => {
      try {
        const res = await fetch("/api/startups");
        const data = await res.json();
        setStartups(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching startups:", err);
      }
    };
    fetchStartups();
  }, []);

  if (startups.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden py-20">
      {/* 🌄 Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center brightness-75"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=2000&q=80')",
        }}
      ></div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/70 to-black/80"></div>

      <div className="relative z-10">
        <h2 className="text-4xl font-extrabold text-center text-white mb-12 tracking-tight drop-shadow-lg">
          🚀 Featured Startups
        </h2>

        {/* Horizontal manual scroll */}
        <motion.div
          className="flex space-x-8 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory px-6 "
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        
        >
          {startups.map((s) => (
            <motion.div
              key={s._id}
              className="flex-shrink-0 w-80 p-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-indigo-200 cursor-pointer"
              whileHover={{ scale: 1.04 }}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/startups/${s._id}`);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/startups/${s._id}`);
                }
              }}
            >
              {/* Logo */}
              {s.logo && (
                <img
                  src={s.logo}
                  alt={s.companyName}
                  className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-indigo-300 shadow-sm object-cover"
                  whileHover={{ rotate: 5 }}
                  transition={{ type: "spring", stiffness: 200 }}
                />
              )}

              {/* Company name */}
              <h3 className="text-xl font-bold text-gray-900 text-center mb-1">
                {s.companyName}
              </h3>
              <p className="text-sm text-indigo-600 text-center font-medium">
                {s.industry}
              </p>

              {/* Founder info */}
              <div className="mt-3 text-sm text-gray-700 leading-relaxed">
                <strong className="text-indigo-700">Founder:</strong>{" "}
                {s.founderName} <br />
                <strong className="text-indigo-700">Email:</strong>{" "}
                {s.founderEmail} <br />
                {s.linkedin && (
                  <a
                    href={s.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    🔗 LinkedIn
                  </a>
                )}
              </div>

              {/* Funding info */}
              <div className="mt-3 text-sm text-gray-700 leading-relaxed">
                <strong className="text-indigo-700">Stage:</strong> {s.stage}{" "}
                <br />
                <strong className="text-indigo-700">Valuation:</strong>{" "}
                {s.valuation} <br />
                <strong className="text-indigo-700">Target:</strong> $
                {s.targetAmount} <br />
                <strong className="text-indigo-700">Equity:</strong>{" "}
                {s.equityOffered}% <br />
                <strong className="text-indigo-700">Min. Investment:</strong> $
                {s.minInvestment}
              </div>

              {/* Website and location */}
              <div className="mt-3 text-sm text-gray-700 leading-relaxed">
                {s.website && (
                  <a
                    href={s.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    🌐 {s.website}
                  </a>
                )}
                <p className="mt-1">{s.location}</p>
              </div>

              {/* Short bio */}
              {s.shortBio && (
                <p className="mt-4 text-sm text-gray-600 italic text-center line-clamp-3">
                  “{s.shortBio}”
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
