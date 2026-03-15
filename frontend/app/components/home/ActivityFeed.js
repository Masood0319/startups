"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  MessageSquare,
  Clock,
  Users,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";

const ActivityFeed = ({ user, limit = 10 }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [user]);

  const fetchActivities = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const payload = await apiRequest(`notifications?limit=${limit}`, { method: "GET" });

      const items = Array.isArray(payload?.data?.notifications) ? payload.data.notifications : [];
      setActivities(items.map((item) => ({
        id: item.id,
        type: item.type,
        icon: item.type === "message" ? MessageSquare : Bell,
        color: item.read ? "text-gray-400" : "text-indigo-400",
        bgColor: item.read ? "bg-gray-500/10" : "bg-indigo-500/10",
        message: item.message,
        user: item.relatedUser?.name || item.title,
        time: formatTimeAgo(item.createdAt),
        metadata: item.data || null,
        timestamp: item.createdAt,
        actionUrl: item.actionUrl,
      })));
    } catch (error) {
      console.error("Error fetching activity feed:", error);
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getActivityLink = (activity) => {
    if (activity.actionUrl) return activity.actionUrl;

    switch (activity.type) {
      case 'connection_request':
      case 'connection_accepted':
      case 'connection_declined':
        return '/connections';
      case 'message':
        return '/messaging';
      case 'profile_view':
      case 'investment_interest':
        return '/investors';
      case 'payment_sent':
      case 'payment_received':
      case 'payment_failed':
      case 'payment_canceled':
      case 'payment_refunded':
        return '/dashboard/payments';
      default:
        return '/dashboard';
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Activity Feed</h2>
            </div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 animate-pulse">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-800 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                    </div>
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
    <section className="py-12 bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Activity Feed</h2>
              <p className="text-gray-400 text-sm mt-1">Latest updates from the startup ecosystem</p>
            </div>
            <button
              onClick={() => fetchActivities(true)}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </button>
          </div>

          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="group bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 hover:border-gray-700 hover:bg-gray-900/70 transition-all duration-300"
                >
                  <div className="flex items-start space-x-4">
                    {/* Activity Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-full ${activity.bgColor} border border-gray-700`}>
                      <Icon className={`w-5 h-5 ${activity.color}`} />
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white text-sm">
                            <span className="font-semibold text-indigo-300">{activity.user}</span>
                            {' '}
                            <span className="text-gray-300">{activity.message}</span>
                          </p>

                          {/* Activity Metadata */}
                          {activity.metadata && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {Object.entries(activity.metadata).map(([key, value], idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-800/50 text-gray-400 border border-gray-700/50"
                                >
                                  {key.replace('_', ' ')}: {Array.isArray(value) ? value.join(', ') : value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center text-xs text-gray-500 ml-2">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeAgo(activity.timestamp) || activity.time}
                        </div>
                      </div>

                      {/* Action Link */}
                      <div className="mt-3 pt-3 border-t border-gray-800">
                        <Link
                          href={getActivityLink(activity)}
                          className="inline-flex items-center text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors group-hover:text-indigo-300"
                        >
                          View Details
                          <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {activities.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Recent Activity</h3>
              <p className="text-gray-400 mb-4">Start connecting with startups and investors to see updates</p>
              <Link
                href="/startups"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Explore Startups
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          )}

          {/* Load More */}
          {activities.length >= limit && (
            <div className="text-center mt-6">
              <button
                onClick={() => fetchActivities()}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Load More Activities
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ActivityFeed;
