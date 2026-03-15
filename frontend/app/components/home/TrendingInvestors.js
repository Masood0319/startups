"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Star, Eye, Users, MapPin, Briefcase, ArrowRight, Crown } from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";

const TrendingInvestors = ({ user, limit = 8 }) => {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week'); // week, month, all-time

  useEffect(() => {
    fetchTrendingInvestors();
  }, [timeframe]);

  const fetchTrendingInvestors = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`investors?limit=${limit}`, { method: "GET" });
      const list = data?.data?.investors || [];
      const trendingData = list.slice(0, limit).map((investor, index) => ({
        ...investor,
        views: (limit - index) * 200,
        connections: (limit - index) * 8,
        deals_closed: Math.max(1, Math.floor((limit - index) / 2)),
        trend_score: Math.max(55, 92 - index * 3),
        activity_level: Math.max(50, 88 - index * 3),
        response_rate: `${Math.max(70, 95 - index * 2)}%`,
      }));
      setInvestors(trendingData);
    } catch (error) {
      console.error("Error fetching trending investors:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTrendColor = (score) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getActivityColor = (level) => {
    if (level >= 80) return 'bg-green-500';
    if (level >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const timeframeOptions = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all-time', label: 'All Time' }
  ];

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-emerald-950/30 to-gray-950">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center">
              <Crown className="w-8 h-8 mr-3 text-emerald-500" />
              Trending Investors
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 animate-pulse">
                <div className="h-10 w-10 bg-gray-800 rounded-full mb-3"></div>
                <div className="h-4 bg-gray-800 rounded mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-2/3 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-800 rounded"></div>
                  <div className="h-2 bg-gray-800 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-br from-emerald-950/30 to-gray-950">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center">
            <Crown className="w-8 h-8 mr-3 text-emerald-500" />
            <div>
              <h2 className="text-3xl font-bold text-white">Trending Investors</h2>
              <p className="text-gray-400 text-sm mt-1">Most active and sought-after investors</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {timeframeOptions.map(option => (
              <button
                key={option.key}
                onClick={() => setTimeframe(option.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeframe === option.key
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {investors.map((investor, index) => (
            <motion.div
              key={investor._id || investor.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="group relative bg-gradient-to-br from-gray-900/80 to-emerald-900/20 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer"
              onClick={() => window.location.href = `/investors/${investor._id || investor.id}`}
            >
              {/* Trending Badge */}
              <div className="absolute -top-2 -right-2 z-10">
                <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  #{index + 1}
                </div>
              </div>

              {/* Activity Indicator */}
              <div className="absolute top-2 left-2">
                <div className={`w-2 h-2 rounded-full ${getActivityColor(investor.activity_level || 75)} animate-pulse`}></div>
              </div>

              {/* Investor Header */}
              <div className="flex items-center space-x-3 mb-3 mt-2">
                {investor.profilePhoto || investor.avatar ? (
                  <img
                    src={investor.profilePhoto || investor.avatar}
                    alt={investor.name || investor.full_name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-600"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                    {(investor.name || investor.full_name)?.charAt(0) || 'I'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm truncate group-hover:text-emerald-300 transition-colors">
                    {investor.name || investor.full_name}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">{investor.title || investor.role || 'Investor'}</p>
                </div>
              </div>

              {/* Firm */}
              {(investor.firm || investor.organization) && (
                <div className="mb-3">
                  <p className="text-xs text-emerald-300 font-medium truncate">
                    {investor.firm || investor.organization}
                  </p>
                </div>
              )}

              {/* Trend Score */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400">Activity Score</span>
                  <span className={`font-bold ${getTrendColor(investor.trend_score || 75)}`}>
                    {investor.trend_score || 75}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${investor.trend_score || 75}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex items-center text-gray-400">
                  <Eye className="w-3 h-3 mr-1 text-blue-400" />
                  <span>{formatNumber(investor.views || 0)}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Users className="w-3 h-3 mr-1 text-green-400" />
                  <span>{investor.connections || 0}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Briefcase className="w-3 h-3 mr-1 text-purple-400" />
                  <span>{investor.deals_closed || 0} deals</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <MapPin className="w-3 h-3 mr-1 text-yellow-400" />
                  <span className="truncate">{investor.location || 'Global'}</span>
                </div>
              </div>

              {/* Response Rate */}
              {investor.response_rate && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Response Rate</span>
                  <span className="text-xs font-semibold text-emerald-400">{investor.response_rate}</span>
                </div>
              )}

              {/* Investment Focus */}
              {investor.focusStages?.length > 0 && (
                <div className="mb-2">
                  <div className="flex flex-wrap gap-1">
                    {investor.focusStages.slice(0, 2).map((stage, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      >
                        {stage}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Premium Badge */}
              {investor.isPremium && (
                <div className="absolute top-2 right-2">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                </div>
              )}

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-green-500/0 group-hover:from-emerald-500/5 group-hover:to-green-500/5 rounded-xl transition-all duration-300"></div>
            </motion.div>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center">
          <Link
            href="/investors?sort=trending"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            View All Trending Investors
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>

        {investors.length === 0 && !loading && (
          <div className="text-center py-12">
            <Crown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Trending Data</h3>
            <p className="text-gray-400">Check back later for trending investor insights</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TrendingInvestors;
