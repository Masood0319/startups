"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, Briefcase, Rocket, ArrowRight } from "lucide-react";
import Link from "next/link";

const HeroSection = ({ user, stats = {} }) => {
  const isStartup = user?.role === "startup" || user?.role === "founder";
  const isInvestor = user?.role === "investor";

  const defaultStats = {
    totalStartups: 1250,
    totalInvestors: 890,
    totalFunding: "2.8B",
    activeConnections: 450,
    ...stats
  };

  const heroContent = {
    startup: {
      title: `Welcome back, ${user?.full_name || "Founder"}!`,
      subtitle: "Connect with investors who align with your vision",
      cta: "Find Investors",
      ctaLink: "/investors",
      secondaryCta: "Update Profile",
      secondaryLink: "/profile",
      gradient: "from-blue-600 to-purple-700"
    },
    investor: {
      title: `Welcome back, ${user?.full_name || "Investor"}!`,
      subtitle: "Discover promising startups and investment opportunities",
      cta: "Browse Startups",
      ctaLink: "/startups",
      secondaryCta: "Portfolio",
      secondaryLink: "/dashboard/investor",
      gradient: "from-green-600 to-blue-700"
    },
    default: {
      title: "Welcome to the Future of Startup Investment",
      subtitle: "Connect visionary founders with strategic investors",
      cta: "Get Started",
      ctaLink: "/signup",
      secondaryCta: "Learn More",
      secondaryLink: "/about",
      gradient: "from-indigo-600 to-purple-700"
    }
  };

  const content = isStartup ? heroContent.startup :
                  isInvestor ? heroContent.investor :
                  heroContent.default;

  const statCards = [
    {
      icon: Rocket,
      value: defaultStats.totalStartups,
      label: "Active Startups",
      color: "text-blue-400"
    },
    {
      icon: Users,
      value: defaultStats.totalInvestors,
      label: "Verified Investors",
      color: "text-green-400"
    },
    {
      icon: TrendingUp,
      value: `$${defaultStats.totalFunding}`,
      label: "Total Funding",
      color: "text-purple-400"
    },
    {
      icon: Briefcase,
      value: defaultStats.activeConnections,
      label: "Active Deals",
      color: "text-yellow-400"
    }
  ];

  return (
    <>
    <section className="relative min-h-[70vh] bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%239C92AC&quot; fill-opacity=&quot;0.1&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;1.5&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>

      </div>

      <div className="relative container mx-auto px-4 py-16 sm:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white space-y-8"
          >
            <div className="space-y-4">
              <motion.h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <span className={`bg-gradient-to-r ${content.gradient} bg-clip-text text-transparent`}>
                  {content.title}
                </span>
              </motion.h1>

              <motion.p
                className="text-xl sm:text-2xl text-gray-300 max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                {content.subtitle}
              </motion.p>
            </div>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Link
                href={content.ctaLink}
                className={`inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r ${content.gradient} hover:opacity-90 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl group`}
              >
                {content.cta}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href={content.secondaryLink}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white/20 hover:border-white/40 rounded-full transition-all duration-300 backdrop-blur-sm"
              >
                {content.secondaryCta}
              </Link>
            </motion.div>

            {/* User-specific quick stats */}
            {user && (
              <motion.div
                className="flex items-center space-x-6 pt-4 text-sm text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                <div>
                  <span className="text-white font-semibold">Status:</span> {user.status || "Active"}
                </div>
                <div>
                  <span className="text-white font-semibold">Member since:</span> {new Date(user.createdAt).getFullYear() || "2024"}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Right Stats Grid */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 gap-6"
          >
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 group-hover:from-white/20 group-hover:to-white/10 transition-all`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 to-transparent"></div>
    </section>
    </>
  );
};

export default HeroSection;
