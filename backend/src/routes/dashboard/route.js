import { getAuthContext } from "#root/lib/auth/authUtils.js";
import connectionService from "#root/services/connectionService.js";
import messageService from "#root/services/messageService.js";
import notificationService from "#root/services/notificationService.js";
import Startup from "#root/models/Startup.js";
import Connection from "#root/models/Connection.js";
import User from "#root/models/User.js";
import connectDB from "#root/lib/mongoose.js";
import { success, error as errorResponse } from "#root/lib/response.js";

/**
 * GET /api/dashboard?role=fundmanager|investor|founder
 * Get dashboard data based on user role
 */
export async function GET(req) {
  try {
    // Authentication
    const { user, userId } = await getAuthContext(req);
    if (!user || !userId) {
      return errorResponse("Authentication required", 401);
    }

    const { searchParams } = new URL(req.url);
    const requestedRole = searchParams.get("role");

    // Use user's actual role if no role specified
    const role = requestedRole || user.role;

    let dashboardData = {};

    switch (role) {
      case "fundmanager":
      case "fund_manager":
        dashboardData = await getFundManagerDashboard(userId);
        break;

      case "investor":
        dashboardData = await getInvestorDashboard(userId);
        break;

      case "founder":
      case "startup":
        dashboardData = await getFounderDashboard(userId);
        break;

      default:
        return errorResponse("Invalid or unrecognized role", 400);
    }

    return success(dashboardData, { role });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * Get fund manager dashboard data
 */
async function getFundManagerDashboard(userId) {
  try {
    await connectDB();

    // Get connection statistics
    const connectionStats = await connectionService.getConnectionStats(userId);

    // Get portfolio companies (startups this fund manager has invested in)
    const connections = await connectionService.getUserConnections(
      userId,
      "accepted",
    );

    const portfolioStartupIds = connections
      .filter((conn) => conn.startupId)
      .map((conn) => conn.startupId);

    const portfolioStartups =
      portfolioStartupIds.length > 0
        ? await Startup.find({ _id: { $in: portfolioStartupIds } })
        : [];

    // Get statistics
    const totalInvestments = connections.length;
    const totalPortfolioValue = portfolioStartups.reduce((sum, startup) => {
      return sum + (startup.valuation || 0);
    }, 0);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentConnections = await Connection.countDocuments({
      $or: [{ userA: userId }, { userB: userId }],
      createdAt: { $gte: thirtyDaysAgo },
    });

    return {
      stats: {
        totalInvestments,
        portfolioCompanies: portfolioStartups.length,
        totalPortfolioValue,
        recentActivity: recentConnections,
        ...connectionStats,
      },
      portfolio: portfolioStartups.map((startup) => ({
        id: startup._id.toString(),
        name: startup.name,
        description: startup.description,
        industry: startup.industry,
        stage: startup.stage,
        valuation: startup.valuation,
        fundingTarget: startup.fundingTarget,
        userId: startup.userId?.toString(),
      })),
      recentConnections: connections.slice(0, 5),
    };
  } catch (error) {
    console.error("getFundManagerDashboard error:", error);
    throw error;
  }
}

/**
 * Get investor dashboard data
 */
async function getInvestorDashboard(userId) {
  try {
    await connectDB();

    // Get connection statistics and data
    const [connectionStats, connections, messageStats, notificationSummary] =
      await Promise.all([
        connectionService.getConnectionStats(userId),
        connectionService.getUserConnections(userId),
        messageService.getMessageStats(userId),
        notificationService.getNotificationSummary(userId),
      ]);

    // Get interested startups (connections made)
    const interestedStartupIds = connections
      .filter((conn) => conn.startupId)
      .map((conn) => conn.startupId);

    const startupDetails =
      interestedStartupIds.length > 0
        ? await Startup.find({ _id: { $in: interestedStartupIds } })
        : [];

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await Connection.countDocuments({
      $or: [{ userA: userId }, { userB: userId }],
      createdAt: { $gte: thirtyDaysAgo },
    });

    return {
      stats: {
        ...connectionStats,
        recentActivity,
        unreadMessages: messageStats.unreadCount,
        activeThreads: messageStats.activeThreads,
        unreadNotifications: notificationSummary.totalUnread,
      },
      connections: connections.slice(0, 10),
      interestedStartups: startupDetails.map((startup) => ({
        id: startup._id.toString(),
        name: startup.name,
        description: startup.description,
        industry: startup.industry,
        stage: startup.stage,
        valuation: startup.valuation,
        fundingTarget: startup.fundingTarget,
        userId: startup.userId?.toString(),
      })),
      messageThreads: await messageService.getMessageThreads(userId, {
        limit: 5,
      }),
    };
  } catch (error) {
    console.error("getInvestorDashboard error:", error);
    throw error;
  }
}

/**
 * Get founder dashboard data
 */
async function getFounderDashboard(userId) {
  try {
    await connectDB();

    // Get founder's startups
    const founderStartups = await Startup.find({ userId }).sort({
      createdAt: -1,
    });

    // Get connection statistics and data
    const [connectionStats, connections, messageStats, notificationSummary] =
      await Promise.all([
        connectionService.getConnectionStats(userId),
        connectionService.getUserConnections(userId),
        messageService.getMessageStats(userId),
        notificationService.getNotificationSummary(userId),
      ]);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await Connection.countDocuments({
      $or: [{ userA: userId }, { userB: userId }],
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get startup performance metrics
    const startupMetrics = await Promise.all(
      founderStartups.map(async (startup) => {
        const startupConnections = await Connection.countDocuments({
          startupId: startup._id,
        });

        return {
          id: startup._id.toString(),
          name: startup.name,
          description: startup.description,
          industry: startup.industry,
          stage: startup.stage,
          valuation: startup.valuation,
          fundingTarget: startup.fundingTarget,
          fundingRaised: startup.fundingRaised,
          connectionCount: startupConnections,
          viewCount: startup.viewCount || 0,
          createdAt: startup.createdAt,
        };
      }),
    );

    return {
      stats: {
        totalStartups: founderStartups.length,
        ...connectionStats,
        recentActivity,
        unreadMessages: messageStats.unreadCount,
        activeThreads: messageStats.activeThreads,
        unreadNotifications: notificationSummary.totalUnread,
        totalFundingTarget: founderStartups.reduce(
          (sum, s) => sum + (s.fundingTarget || 0),
          0,
        ),
        totalFundingRaised: founderStartups.reduce(
          (sum, s) => sum + (s.fundingRaised || 0),
          0,
        ),
      },
      startups: startupMetrics,
      connections: connections.slice(0, 10),
      messageThreads: await messageService.getMessageThreads(userId, {
        limit: 5,
      }),
      recentNotifications: await notificationService.getUserNotifications(
        userId,
        { limit: 5 },
      ),
    };
  } catch (error) {
    console.error("getFounderDashboard error:", error);
    throw error;
  }
}
