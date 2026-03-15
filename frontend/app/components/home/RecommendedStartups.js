"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, MapPin, Users, DollarSign, ExternalLink, Heart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";

const RecommendedStartups = ({ user, limit = 6 }) => {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedStartups, setSavedStartups] = useState(new Set());

  useEffect(() => {
    fetchRecommendedStartups();
  }, [user]);

  const fetchRecommendedStartups = async () => {
    try {
      setLoading(true);
      // TODO: Create /api/startups/recommended endpoint
      const data = await apiRequest(`startups/recommended?limit=${limit}`, {
        method: "GET",
      });
      const normalizedStartups = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.startups)
            ? data.startups
            : [];
      setStartups(normalizedStartups);
    } catch (error) {
      console.error("Error fetching recommended startups:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveStartup = async (startupId) => {
    setSavedStartups((prev) => {
      const next = new Set(prev);
      if (next.has(startupId)) next.delete(startupId);
      else next.add(startupId);
      return next;
    });
  };

  const formatFunding = (amount) => {
    if (!amount) return "TBA";
    const num = parseInt(amount.toString().replace(/[^\d]/g, ''));
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num}`;
  };

  const getStageColor = (stage) => {
    const colors = {
      'pre-seed': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'seed': 'bg-green-500/20 text-green-400 border-green-500/30',
      'series-a': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'series-b': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'growth': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[stage?.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };
  const list = Array.isArray(startups) ? startups : [];

  if (loading) {
    return (
      <section className="py-12 bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">Recommended Startups</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 animate-pulse">
                <div className="h-16 w-16 bg-gray-800 rounded-full mb-4"></div>
                <div className="h-4 bg-gray-800 rounded mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-2/3 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-800 rounded"></div>
                  <div className="h-3 bg-gray-800 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Recommended For You</h2>
            <p className="text-gray-400">Startups matching your investment criteria and interests</p>
          </div>
          <Link
            href="/startups"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((startup, index) => (
            <motion.div
              key={startup._id || startup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="group bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-indigo-500/50 hover:bg-gray-900/70 transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {startup.logo ? (
                    <img
                      src={startup.logo}
                      alt={startup.companyName || startup.name}
                      className="w-12 h-12 rounded-full object-cover border border-gray-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {(startup.companyName || startup.name)?.charAt(0) || 'S'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-white text-lg group-hover:text-indigo-300 transition-colors">
                      {startup.companyName || startup.name}
                    </h3>
                    <p className="text-sm text-gray-400">{startup.industry}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSaveStartup(startup._id || startup.id);
                  }}
                  className={`p-2 rounded-full transition-all ${
                    savedStartups.has(startup._id || startup.id)
                      ? 'text-red-400 bg-red-500/20'
                      : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${savedStartups.has(startup._id || startup.id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Stage Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStageColor(startup.stage)}`}>
                  {startup.stage || 'Seed'}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                {startup.shortBio || startup.description || "Innovative startup looking to make an impact in their industry."}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center text-gray-400">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
                  <span>{formatFunding(startup.targetAmount)}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <DollarSign className="w-4 h-4 mr-2 text-blue-400" />
                  <span>{startup.equityOffered || 10}% equity</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                  <span className="truncate">{startup.location || 'Remote'}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Users className="w-4 h-4 mr-2 text-yellow-400" />
                  <span>{startup.teamSize || '2-10'} team</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Link
                  href={`/startups/${startup._id || startup.id}`}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  View Details
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Implement quick connect functionality
                    window.location.href = `/connect/${startup._id || startup.id}`;
                  }}
                  className="px-4 py-2 border border-gray-600 hover:border-indigo-500 text-gray-300 hover:text-white rounded-lg transition-all text-sm font-medium"
                >
                  Connect
                </button>
              </div>

              {/* Match Score (if available from AI) */}
              {startup.matchScore && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">AI Match Score</span>
                    <span className="text-green-400 font-medium">{startup.matchScore}% match</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${startup.matchScore}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {list.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Recommendations Yet</h3>
            <p className="text-gray-400 mb-4">Complete your investor profile to get personalized startup recommendations</p>
            <Link
              href="/profile"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Complete Profile
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecommendedStartups;
