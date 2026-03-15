"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Bell, MessageSquare, CheckCircle, Clock, Loader2 } from "lucide-react";
import Navbar from "../components/navbar";
import { apiRequest } from "@/lib/apiClient";

const timeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
};

const NotificationItem = ({ notification, onMarkRead }) => {
  const iconMap = {
    message: MessageSquare,
    connection_accepted: CheckCircle,
    default: Bell,
  };

  const Icon = iconMap[notification.type] || iconMap.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start p-4 mb-3 rounded-xl shadow-lg border transition duration-300 ${
        notification.read
          ? "bg-gray-800 border-gray-700 text-gray-400 opacity-80"
          : "bg-gray-900 border-indigo-600/50 text-white hover:bg-gray-800"
      }`}
    >
      <div
        className={`p-3 rounded-full ${notification.read ? "bg-gray-700" : "bg-indigo-600"} flex-shrink-0 mr-4`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${notification.read ? "text-gray-400" : "text-white"}`}>
          {notification.title}
        </p>
        <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
        <div className="flex items-center text-xs mt-2 text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          <span>{timeAgo(notification.createdAt)}</span>
        </div>
      </div>
      {!notification.read && (
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-red-500 rounded-full" title="New" />
          <button
            onClick={() => onMarkRead(notification.id)}
            className="text-xs text-indigo-300 hover:text-indigo-200"
          >
            Mark read
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [notificationsJson, summaryJson] = await Promise.all([
        apiRequest("notifications?limit=50", { method: "GET" }),
        apiRequest("notifications/summary", { method: "GET" }),
      ]);

      setNotifications(notificationsJson?.data?.notifications || []);
      setSummary(summaryJson?.data || null);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await apiRequest("notifications", {
        method: "PATCH",
        data: {},
      });
      await loadNotifications();
    } catch (err) {
      setError(err.message || "Failed to mark all as read");
    }
  }, [loadNotifications]);

  const handleMarkSingleRead = useCallback(
    async (id) => {
      try {
        await apiRequest(`notifications/${id}`, {
          method: "PATCH",
          data: { action: "mark_read" },
        });
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      } catch (err) {
        setError(err.message || "Failed to mark notification as read");
      }
    },
    [],
  );

  const unreadCount = summary?.unreadNotifications ?? notifications.filter((n) => !n.read).length;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-950 text-white pt-16 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6">
            <h1 className="text-3xl font-bold flex items-center">
              <Bell className="w-7 h-7 mr-3 text-indigo-400" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-3 text-sm font-extrabold bg-red-600 text-white rounded-full h-6 px-3 flex items-center justify-center">
                  {unreadCount} New
                </span>
              )}
            </h1>
            <motion.button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-500 transition disabled:bg-gray-700 disabled:text-gray-500"
              disabled={unreadCount === 0 || loading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Mark all as read
            </motion.button>
          </header>

          {error && <div className="p-3 bg-red-900 border border-red-700 rounded-lg mb-4 text-sm">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center p-12 text-indigo-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading notifications...
            </div>
          ) : (
            <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <NotificationItem key={n.id} notification={n} onMarkRead={handleMarkSingleRead} />
                ))
              ) : (
                <div className="p-12 text-center text-gray-500 bg-gray-900 rounded-xl mt-4">
                  You are all caught up! No recent notifications.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
