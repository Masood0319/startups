"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Star,
  Zap,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

const AIRecommendationsPanel = ({ user }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('recommendations');

  const isStartup = user?.role === "startup" || user?.role === "founder";
  const isInvestor = user?.role === "investor";

  useEffect(() => {
    fetchAIData();
  }, [user]);

  const fetchAIData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const mockData = generateMockAIData();
      setRecommendations(mockData.recommendations);
      setInsights(mockData.insights);
    } catch (error) {
      console.error("Error fetching AI data:", error);
      const mockData = generateMockAIData();
      setRecommendations(mockData.recommendations);
      setInsights(mockData.insights);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateMockAIData = () => {
    if (isStartup) {
      return {
        recommendations: [
          {
            id: 'rec_1',
            type: 'investor_match',
            title: 'Perfect Investor Match',
            description: 'Sarah Chen from Ascent Capital is 94% compatible with your startup profile',
            action: 'Connect Now',
            actionUrl: '/investors/sarah-chen',
            confidence: 94,
            icon: Target,
            color: 'text-green-400',
            bgColor: 'bg-green-500/10'
          },
          {
            id: 'rec_2',
            type: 'strategy',
            title: 'Optimize Your Pitch',
            description: 'AI suggests highlighting your user growth metrics more prominently',
            action: 'View Tips',
            actionUrl: '/resources/pitch-optimization',
            confidence: 87,
            icon: Lightbulb,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/10'
          },
          {
            id: 'rec_3',
            type: 'networking',
            title: 'Industry Event Match',
            description: 'FinTech Summit 2024 has 12 relevant investors attending',
            action: 'Learn More',
            actionUrl: '/events/fintech-summit-2024',
            confidence: 91,
            icon: Users,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10'
          }
        ],
        insights: [
          {
            id: 'insight_1',
            title: 'Market Trends',
            content: 'FinTech startups are raising 23% more in Q4 compared to Q3',
            category: 'Market Analysis',
            impact: 'high',
            icon: TrendingUp
          },
          {
            id: 'insight_2',
            title: 'Competitor Activity',
            content: '3 similar startups raised funding in the past month',
            category: 'Competition',
            impact: 'medium',
            icon: Users
          },
          {
            id: 'insight_3',
            title: 'Investor Preferences',
            content: 'Top investors in your sector prefer startups with 50K+ MRR',
            category: 'Funding Insights',
            impact: 'high',
            icon: Target
          }
        ]
      };
    } else if (isInvestor) {
      return {
        recommendations: [
          {
            id: 'rec_1',
            type: 'startup_match',
            title: 'High-Potential Startup',
            description: 'TechFlow Solutions matches 96% of your investment criteria',
            action: 'Review Startup',
            actionUrl: '/startups/techflow-solutions',
            confidence: 96,
            icon: Sparkles,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10'
          },
          {
            id: 'rec_2',
            type: 'portfolio',
            title: 'Portfolio Diversification',
            description: 'Consider adding a CleanTech startup to balance your portfolio',
            action: 'Browse CleanTech',
            actionUrl: '/startups?category=cleantech',
            confidence: 83,
            icon: TrendingUp,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10'
          },
          {
            id: 'rec_3',
            type: 'deal_flow',
            title: 'Trending Sector Alert',
            description: 'AI/ML startups are showing 45% higher success rates this quarter',
            action: 'Explore AI Startups',
            actionUrl: '/startups?category=ai',
            confidence: 89,
            icon: Brain,
            color: 'text-indigo-400',
            bgColor: 'bg-indigo-500/10'
          }
        ],
        insights: [
          {
            id: 'insight_1',
            title: 'Market Opportunity',
            content: 'Series A funding in your focus sectors increased by 34%',
            category: 'Market Trends',
            impact: 'high',
            icon: TrendingUp
          },
          {
            id: 'insight_2',
            title: 'Deal Pipeline',
            content: '15 startups in your watchlist are raising new rounds',
            category: 'Deal Flow',
            impact: 'medium',
            icon: Target
          },
          {
            id: 'insight_3',
            title: 'Portfolio Performance',
            content: 'Your portfolio companies outperformed market by 18%',
            category: 'Performance',
            impact: 'high',
            icon: Star
          }
        ]
      };
    } else {
      return {
        recommendations: [
          {
            id: 'rec_1',
            type: 'platform',
            title: 'Complete Your Profile',
            description: 'Get 3x more relevant matches by completing your profile',
            action: 'Complete Now',
            actionUrl: '/profile',
            confidence: 100,
            icon: Users,
            color: 'text-indigo-400',
            bgColor: 'bg-indigo-500/10'
          }
        ],
        insights: [
          {
            id: 'insight_1',
            title: 'Platform Activity',
            content: '1,200+ startups and 890+ investors are actively using the platform',
            category: 'Platform Stats',
            impact: 'medium',
            icon: Users
          }
        ]
      };
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'text-red-400 bg-red-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'low':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const tabs = [
    { id: 'recommendations', label: 'AI Recommendations', icon: Brain },
    { id: 'insights', label: 'Market Insights', icon: Lightbulb }
  ];

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-indigo-950/30 to-purple-950/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gray-800 rounded-lg animate-pulse"></div>
              <div className="h-6 bg-gray-800 rounded w-48 animate-pulse"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 animate-pulse">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-800 rounded"></div>
                    <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-br from-indigo-950/30 to-purple-950/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">AI-Powered Insights</h2>
                <p className="text-gray-400 text-sm mt-1">Personalized recommendations powered by machine learning</p>
              </div>
            </div>
            <button
              onClick={() => fetchAIData(true)}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh AI</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-900/50 p-1 rounded-xl">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          {activeTab === 'recommendations' ? (
            <div className="space-y-4">
              {recommendations.map((rec, index) => {
                const Icon = rec.icon;
                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="group bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-indigo-500/50 hover:bg-gray-900/70 transition-all duration-300"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 p-3 rounded-xl ${rec.bgColor} border border-gray-700`}>
                        <Icon className={`w-6 h-6 ${rec.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">{rec.title}</h3>
                            <p className="text-gray-300 text-sm">{rec.description}</p>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <div className="flex items-center space-x-1">
                              <Zap className="w-3 h-3 text-yellow-400" />
                              <span className="text-xs font-semibold text-yellow-400">{rec.confidence}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Link
                            href={rec.actionUrl}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors group-hover:bg-indigo-700"
                          >
                            {rec.action}
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Link>

                          <div className="flex items-center text-xs text-gray-500">
                            <Brain className="w-3 h-3 mr-1" />
                            AI Powered
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {insights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-purple-500/50 hover:bg-gray-900/70 transition-all duration-300 group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 p-2 bg-purple-500/10 rounded-lg">
                        <Icon className="w-5 h-5 text-purple-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-white text-sm">{insight.title}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                            {insight.impact} impact
                          </span>
                        </div>

                        <p className="text-gray-300 text-sm mb-3">{insight.content}</p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{insight.category}</span>
                          <button className="text-purple-400 hover:text-purple-300 transition-colors">
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {((activeTab === 'recommendations' && recommendations.length === 0) ||
            (activeTab === 'insights' && insights.length === 0)) && !loading && (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No AI Data Available</h3>
              <p className="text-gray-400 mb-4">Complete your profile to get personalized AI recommendations</p>
              <Link
                href="/profile"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Complete Profile
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-8 p-4 bg-gray-900/30 rounded-xl border border-gray-800">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>
                AI recommendations are updated every hour based on your profile, activity, and market trends.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIRecommendationsPanel;
