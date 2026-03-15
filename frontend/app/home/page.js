"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/navbar";

// Import all home components
import HeroSection from "../components/home/HeroSection";
import RecommendedStartups from "../components/home/RecommendedStartups";
import RecommendedInvestors from "../components/home/RecommendedInvestors";
import TrendingStartups from "../components/home/TrendingStartups";
import TrendingInvestors from "../components/home/TrendingInvestors";
import CategoriesScroller from "../components/home/CategoriesScroller";
import ActivityFeed from "../components/home/ActivityFeed";
import AIRecommendationsPanel from "../components/home/AIRecommendationsPanel";
import { apiRequest } from "@/lib/apiClient";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchUserData();
    fetchPlatformStats();
  }, []);

  const fetchUserData = async () => {
    try {
      const data = await apiRequest("users", { method: "GET" });
      setUser(data?.data?.user || null);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      // TODO: Create /api/platform/stats endpoint
      const data = await apiRequest("platform/stats", { method: "GET" });
      setStats(data?.data || {});
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      setStats({
        totalStartups: 1250,
        totalInvestors: 890,
        totalFunding: "2.8B",
        activeConnections: 450,
      });
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    // Optionally trigger re-fetch of filtered content
  };

  // Determine user role
  const isStartup = user?.role === "startup" || user?.role === "founder";
  const isInvestor = user?.role === "investor";
  const isAuthenticated = !!user;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-400">
              Loading 
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>

      {/* Hero Section - Always shown but personalized */}
      <HeroSection user={user} stats={stats} />

      {/* Categories Scroller - Always shown */}
      <CategoriesScroller
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
      />

      {/* Role-based Content Sections */}
      <div className="space-y-0">
        {/* For Investors - Show startup-focused content */}
        {isInvestor && (
          <>
            <RecommendedStartups user={user} limit={6} />
            <TrendingStartups user={user} limit={8} />
          </>
        )}

        {/* For Startups/Founders - Show investor-focused content */}
        {isStartup && (
          <>
            <RecommendedInvestors user={user} limit={6} />
            <TrendingInvestors user={user} limit={8} />
          </>
        )}

        {/* For Non-authenticated users - Show both */}
        {!isAuthenticated && (
          <>
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="py-12 bg-gradient-to-br from-gray-900 to-gray-950"
            >
              <div className="container mx-auto px-4 text-center">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Join the Future of Startup Investment
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Connect with visionary founders and strategic investors. Get
                  personalized recommendations powered by AI.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="/signup"
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
                  >
                    Get Started Free
                  </motion.a>
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="/startups"
                    className="px-8 py-4 border-2 border-white/20 hover:border-white/40 text-white rounded-full font-semibold text-lg transition-all backdrop-blur-sm"
                  >
                    Browse Startups
                  </motion.a>
                </div>
              </div>
            </motion.section>

            <TrendingStartups user={null} limit={4} />
            <TrendingInvestors user={null} limit={4} />
          </>
        )}

        {/* AI Recommendations Panel - For authenticated users only */}
        {isAuthenticated && <AIRecommendationsPanel user={user} />}

        {/* Activity Feed - For authenticated users only */}
        {isAuthenticated && <ActivityFeed user={user} limit={10} />}

        {/* Guest Activity Preview - For non-authenticated users */}
        {!isAuthenticated && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="py-12 bg-gray-950"
          >
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  See What&apos;s Happening
                </h2>
                <p className="text-gray-400 mb-8">
                  Join our community to get personalized activity feeds and
                  AI-powered insights
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-6 h-6 bg-blue-500 rounded-full"
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Live Activity
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Track funding rounds, connections, and market trends in
                      real-time
                    </p>
                  </div>

                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      AI Insights
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Get personalized recommendations and market intelligence
                    </p>
                  </div>

                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <motion.div
                        animate={{ y: [-2, 2, -2] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-6 h-6 bg-green-500 rounded-full"
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Smart Matching
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Connect with the right partners using advanced algorithms
                    </p>
                  </div>
                </div>

                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="/login"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  Sign In to See More
                </motion.a>
              </div>
            </div>
          </motion.section>
        )}
      </div>

      {/* Footer CTA for non-authenticated users */}
      {!isAuthenticated && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="py-16 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900"
        >
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Investment Journey?
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Join thousands of founders and investors who are already building
              the future together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/signup?role=founder"
                className="px-8 py-4 bg-white text-purple-900 rounded-full font-bold text-lg hover:bg-purple-50 transition-all shadow-xl"
              >
                Join as Founder
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/signup?role=investor"
                className="px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-purple-900 rounded-full font-bold text-lg transition-all"
              >
                Join as Investor
              </motion.a>
            </div>
          </div>
        </motion.section>
      )}
    </>
  );
}
