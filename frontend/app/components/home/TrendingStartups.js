"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Flame,
  Eye,
  Heart,
  MapPin,
  Users,
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";

const TrendingStartups = ({ user, limit = 8 }) => {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("week"); // week, month, all-time

  useEffect(() => {
    fetchTrendingStartups();
  }, [timeframe]);

  const fetchTrendingStartups = async () => {
    try {
      setLoading(true);
      // TODO: Create /api/startups/trending endpoint
      const data = await apiRequest(
        `startups/trending?timeframe=${timeframe}&limit=${limit}`,
        { method: "GET" },
      );
      const trending = Array.isArray(data?.data) ? data.data : [];
      setStartups(trending);
    } catch (error) {
      console.error("Error fetching trending startups:", error);
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
    if (score >= 80) return "text-red-400";
    if (score >= 60) return "text-orange-400";
    return "text-yellow-400";
  };
  const list = Array.isArray(startups) ? startups : [];

  const timeframeOptions = [
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all-time", label: "All Time" },
  ];

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-gray-900 to-gray-950">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center">
              <Flame className="w-8 h-8 mr-3 text-orange-500" />
              Trending Startups
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 animate-pulse"
              >
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
    <section className="py-12 bg-gradient-to-br from-gray-900 to-gray-950">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center">
            <Flame className="w-8 h-8 mr-3 text-orange-500" />
            <div>
              <h2 className="text-3xl font-bold text-white">
                Trending Startups
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Most viewed and connected startups
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {timeframeOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setTimeframe(option.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeframe === option.key
                    ? "bg-orange-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {list.map((startup, index) => (
            <motion.div
              key={startup._id || startup.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer"
              onClick={() =>
                (window.location.href = `/startups/${startup._id || startup.id}`)
              }
            >
              {/* Trending Badge */}
              <div className="absolute -top-2 -right-2 z-10">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />#{index + 1}
                </div>
              </div>

              {/* Startup Header */}
              <div className="flex items-center space-x-3 mb-3">
                {startup.logo ? (
                  <img
                    src={startup.logo}
                    alt={startup.companyName || startup.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-600"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">
                    {(startup.companyName || startup.name)?.charAt(0) || "S"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm truncate group-hover:text-orange-300 transition-colors">
                    {startup.companyName || startup.name}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {startup.industry}
                  </p>
                </div>
              </div>

              {/* Trend Score */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400">Trend Score</span>
                  <span
                    className={`font-bold ${getTrendColor(startup.trend_score || 75)}`}
                  >
                    {startup.trend_score || 75}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${startup.trend_score || 75}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex items-center text-gray-400">
                  <Eye className="w-3 h-3 mr-1 text-blue-400" />
                  <span>{formatNumber(startup.views || 0)}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Heart className="w-3 h-3 mr-1 text-red-400" />
                  <span>{formatNumber(startup.likes || 0)}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Users className="w-3 h-3 mr-1 text-green-400" />
                  <span>{startup.connections || 0}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <MapPin className="w-3 h-3 mr-1 text-purple-400" />
                  <span className="truncate">
                    {startup.location || "Remote"}
                  </span>
                </div>
              </div>

              {/* Growth Indicator */}
              {startup.growth_rate && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Growth</span>
                  <span className="text-xs font-semibold text-green-400">
                    {startup.growth_rate}
                  </span>
                </div>
              )}

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 to-red-500/0 group-hover:from-orange-500/5 group-hover:to-red-500/5 rounded-xl transition-all duration-300"></div>
            </motion.div>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center">
          <Link
            href="/startups?sort=trending"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            View All Trending Startups
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>

        {startups.length === 0 && !loading && (
          <div className="text-center py-12">
            <Flame className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Trending Data
            </h3>
            <p className="text-gray-400">
              Check back later for trending startup insights
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TrendingStartups;
