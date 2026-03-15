"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, MapPin, Briefcase, DollarSign, Star, ArrowRight, Building } from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";

const RecommendedInvestors = ({ user, limit = 6 }) => {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedInvestors, setSavedInvestors] = useState(new Set());

  useEffect(() => {
    fetchRecommendedInvestors();
  }, [user]);

  const fetchRecommendedInvestors = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`investors?limit=${limit}`, { method: "GET" });
      const list = data?.data?.investors || [];
      setInvestors(Array.isArray(list) ? list.slice(0, limit) : []);
    } catch (error) {
      console.error("Error fetching recommended investors:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveInvestor = async (investorId) => {
    setSavedInvestors((prev) => {
      const next = new Set(prev);
      if (next.has(investorId)) next.delete(investorId);
      else next.add(investorId);
      return next;
    });
  };

  const formatCheckSize = (checkSize) => {
    if (!checkSize) return "Varies";
    if (typeof checkSize === 'string') return checkSize;
    const num = parseInt(checkSize.toString().replace(/[^\d]/g, ''));
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
      'growth': 'bg-red-500/20 text-red-400 border-red-500/30',
      'all-stages': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    };
    return colors[stage?.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (loading) {
    return (
      <section className="py-12 bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">Recommended Investors</h2>
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
            <h2 className="text-3xl font-bold text-white mb-2">Perfect Match Investors</h2>
            <p className="text-gray-400">Investors aligned with your industry, stage, and funding needs</p>
          </div>
          <Link
            href="/investors"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {investors.map((investor, index) => (
            <motion.div
              key={investor._id || investor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="group bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-green-500/50 hover:bg-gray-900/70 transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {investor.profilePhoto || investor.avatar ? (
                    <img
                      src={investor.profilePhoto || investor.avatar}
                      alt={investor.name || investor.full_name}
                      className="w-12 h-12 rounded-full object-cover border border-gray-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                      {(investor.name || investor.full_name)?.charAt(0) || 'I'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-white text-lg group-hover:text-green-300 transition-colors">
                      {investor.name || investor.full_name}
                    </h3>
                    <p className="text-sm text-gray-400">{investor.title || investor.role || 'Investor'}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSaveInvestor(investor._id || investor.id);
                  }}
                  className={`p-2 rounded-full transition-all ${
                    savedInvestors.has(investor._id || investor.id)
                      ? 'text-yellow-400 bg-yellow-500/20'
                      : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10'
                  }`}
                >
                  <Star className={`w-4 h-4 ${savedInvestors.has(investor._id || investor.id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Firm/Organization */}
              {(investor.firm || investor.organization) && (
                <div className="mb-3">
                  <div className="flex items-center text-sm text-gray-300">
                    <Building className="w-4 h-4 mr-2 text-blue-400" />
                    <span className="font-medium">{investor.firm || investor.organization}</span>
                  </div>
                </div>
              )}

              {/* Investment Focus */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {investor.focusStages?.slice(0, 2).map((stage, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStageColor(stage)}`}
                    >
                      {stage}
                    </span>
                  )) || (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStageColor('seed')}`}>
                      Seed
                    </span>
                  )}
                  {investor.sectors?.slice(0, 1).map((sector, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    >
                      {sector}
                    </span>
                  )) || (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {investor.sector || investor.industry || 'Tech'}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                {investor.bio || investor.description || "Experienced investor focused on supporting innovative startups and entrepreneurs."}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center text-gray-400">
                  <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                  <span>{formatCheckSize(investor.checkSize || investor.typical_investment)}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Briefcase className="w-4 h-4 mr-2 text-blue-400" />
                  <span>{investor.portfolio_count || investor.investments || '10+'} deals</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                  <span className="truncate">{investor.location || 'Global'}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <TrendingUp className="w-4 h-4 mr-2 text-yellow-400" />
                  <span>{investor.experience_years || '5+'}y exp</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Link
                  href={`/investors/${investor._id || investor.id}`}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  View Profile
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Implement quick connect/pitch functionality
                    window.location.href = `/connect/investor/${investor._id || investor.id}`;
                  }}
                  className="px-4 py-2 border border-gray-600 hover:border-green-500 text-gray-300 hover:text-white rounded-lg transition-all text-sm font-medium"
                >
                  Connect
                </button>
              </div>

              {/* Match Score (if available from AI) */}
              {investor.matchScore && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">AI Match Score</span>
                    <span className="text-green-400 font-medium">{investor.matchScore}% match</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${investor.matchScore}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Active Badge */}
              {investor.isActivelyInvesting !== false && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <div className="flex items-center text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-green-400 font-medium">Actively investing</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {investors.length === 0 && !loading && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Recommendations Yet</h3>
            <p className="text-gray-400 mb-4">Complete your startup profile to get personalized investor recommendations</p>
            <Link
              href="/profile"
              className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
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

export default RecommendedInvestors;
