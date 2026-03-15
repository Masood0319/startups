import connectDB from "#root/lib/mongoose.js";
import User from "#root/models/User.js";
import Startup from "#root/models/Startup.js";
import Connection from "#root/models/Connection.js";
import Message from "#root/models/Message.js";
import { success } from "#root/lib/response.js";

/**
 * GET /api/platform/stats - Get platform-wide statistics
 * Public endpoint for displaying platform metrics on homepage
 */
export async function GET(req) {
  try {
    await connectDB();

    // Get platform statistics using models
    const [
      totalUsers,
      totalStartups,
      totalConnections,
      acceptedConnections,
      totalMessages,
    ] = await Promise.all([
      User.countDocuments(),
      Startup.countDocuments({ status: { $in: ["approved", "pending"] } }),
      Connection.countDocuments(),
      Connection.countDocuments({ status: "accepted" }),
      Message.countDocuments(),
    ]);

    // Get user breakdown
    const [founders, investors, fundManagers] = await Promise.all([
      User.countDocuments({ role: { $in: ["founder", "startup"] } }),
      User.countDocuments({ role: "investor" }),
      User.countDocuments({ role: "fund_manager" }),
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentStartups, recentConnections, recentUsers] = await Promise.all([
      Startup.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Connection.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    // Calculate success metrics
    const connectionSuccessRate =
      totalConnections > 0
        ? Math.round((acceptedConnections / totalConnections) * 100)
        : 0;

    // Get trending stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyActivity = await Promise.all([
      Connection.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Message.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Startup.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    const stats = {
      users: {
        total: totalUsers,
        founders,
        investors,
        fundManagers,
        recent: recentUsers,
      },
      startups: {
        total: totalStartups,
        recent: recentStartups,
        weeklyNew: weeklyActivity[2],
      },
      connections: {
        total: totalConnections,
        accepted: acceptedConnections,
        recent: recentConnections,
        successRate: connectionSuccessRate,
        weeklyNew: weeklyActivity[0],
      },
      messages: {
        total: totalMessages,
        weeklyNew: weeklyActivity[1],
      },
      activity: {
        period: "Last 30 days",
        newStartups: recentStartups,
        newConnections: recentConnections,
        newUsers: recentUsers,
      },
      growth: {
        weeklyConnections: weeklyActivity[0],
        weeklyMessages: weeklyActivity[1],
        weeklyStartups: weeklyActivity[2],
      },
      engagement: {
        averageConnectionsPerUser:
          totalUsers > 0
            ? Math.round((totalConnections / totalUsers) * 10) / 10
            : 0,
        averageMessagesPerConnection:
          acceptedConnections > 0
            ? Math.round((totalMessages / acceptedConnections) * 10) / 10
            : 0,
      },
    };

    return success(stats, {
      generatedAt: new Date().toISOString(),
      version: "1.0.0",
    });
  } catch (error) {
    console.error("GET /api/platform/stats error:", error);

    // Return generic stats if database fails (graceful degradation)
    const fallbackStats = {
      users: {
        total: 0,
        founders: 0,
        investors: 0,
        fundManagers: 0,
        recent: 0,
      },
      startups: {
        total: 0,
        recent: 0,
        weeklyNew: 0,
      },
      connections: {
        total: 0,
        accepted: 0,
        recent: 0,
        successRate: 0,
        weeklyNew: 0,
      },
      messages: {
        total: 0,
        weeklyNew: 0,
      },
      activity: {
        period: "Last 30 days",
        newStartups: 0,
        newConnections: 0,
        newUsers: 0,
      },
      growth: {
        weeklyConnections: 0,
        weeklyMessages: 0,
        weeklyStartups: 0,
      },
      engagement: {
        averageConnectionsPerUser: 0,
        averageMessagesPerConnection: 0,
      },
    };

    return success(fallbackStats, {
      generatedAt: new Date().toISOString(),
      version: "1.0.0",
      fallback: true,
    });
  }
}
