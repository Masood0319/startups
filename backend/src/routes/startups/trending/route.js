import connectDB from "#root/lib/mongoose.js";
import Startup from "#root/models/Startup.js";
import Connection from "#root/models/Connection.js";
import { success, error } from "#root/lib/response.js";

/**
 * GET /api/startups/trending?limit=10
 * Get trending startups based on recent connection activity
 */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit")) || 10;
    const days = parseInt(searchParams.get("days")) || 7;

    // Validate limit parameter
    if (limit < 1 || limit > 50) {
      return error("Limit must be between 1 and 50", 400);
    }

    // Validate days parameter
    if (days < 1 || days > 30) {
      return error("Days must be between 1 and 30", 400);
    }

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Get startups with recent activity using aggregation
    const trendingData = await Connection.aggregate([
      {
        $match: {
          createdAt: { $gte: dateThreshold },
          startupId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$startupId",
          connectionCount: { $sum: 1 },
          acceptedCount: {
            $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
          },
          lastActivity: { $max: "$createdAt" },
        },
      },
      {
        $addFields: {
          trendingScore: {
            $add: [
              "$connectionCount",
              { $multiply: ["$acceptedCount", 2] }, // Weight accepted connections more
            ],
          },
        },
      },
      {
        $sort: { trendingScore: -1, lastActivity: -1 },
      },
      { $limit: limit * 2 }, // Get more to allow for filtering
    ]);

    if (trendingData.length === 0) {
      // Fallback to recently created startups if no trending data
      const fallbackStartups = await Startup.find({
        status: { $in: ["approved", "pending"] },
        visibility: { $in: ["public", "connections-only"] },
      })
        .sort({ createdAt: -1, viewCount: -1 })
        .limit(limit)
        .populate("userId", "full_name avatar");

      const formatted = fallbackStartups.map((startup) => ({
        id: startup._id.toString(),
        name: startup.name,
        description: startup.description,
        tagline: startup.tagline,
        industry: startup.industry,
        stage: startup.stage,
        location: startup.geography || startup.location,
        foundedYear: startup.foundedYear,
        fundingTarget: startup.fundingTarget,
        valuation: startup.valuation,
        logoUrl: startup.logoUrl,
        website: startup.website,
        founder: startup.userId
          ? {
              name: startup.userId.full_name,
              avatar: startup.userId.avatar,
            }
          : null,
        trending: {
          connections: 0,
          acceptedConnections: 0,
          score: 0,
          views: startup.viewCount || 0,
          reason: "recently_created",
        },
        createdAt: startup.createdAt,
      }));

      return success(formatted, {
        count: formatted.length,
        limit,
        algorithm: "recent_fallback",
        period: `last_${days}_days`,
        fallback: true,
      });
    }

    // Get startup details for trending startups
    const startupIds = trendingData.map((trend) => trend._id);
    const startups = await Startup.find({
      _id: { $in: startupIds },
      status: { $in: ["approved", "pending"] },
      visibility: { $in: ["public", "connections-only"] },
    })
      .populate("userId", "full_name avatar")
      .lean();

    // Combine trending data with startup details
    const trendingStartups = trendingData
      .map((trend) => {
        const startup = startups.find(
          (s) => s._id.toString() === trend._id.toString(),
        );
        if (!startup) return null;

        return {
          id: startup._id.toString(),
          name: startup.name,
          description: startup.description,
          tagline: startup.tagline,
          industry: startup.industry,
          stage: startup.stage,
          location: startup.geography || startup.location,
          foundedYear: startup.foundedYear,
          fundingTarget: startup.fundingTarget,
          fundingRaised: startup.fundingRaised,
          valuation: startup.valuation,
          logoUrl: startup.logoUrl,
          website: startup.website,
          teamSize: startup.teamSize,
          businessModel: startup.businessModel,
          founder: startup.userId
            ? {
                name: startup.userId.full_name,
                avatar: startup.userId.avatar,
              }
            : null,
          trending: {
            connections: trend.connectionCount,
            acceptedConnections: trend.acceptedCount,
            score: trend.trendingScore,
            views: startup.viewCount || 0,
            lastActivity: trend.lastActivity,
            reason: "connection_activity",
          },
          createdAt: startup.createdAt,
        };
      })
      .filter((startup) => startup !== null)
      .slice(0, limit);

    return success(trendingStartups, {
      count: trendingStartups.length,
      limit,
      algorithm: "connection_activity",
      period: `last_${days}_days`,
      fallback: false,
    });
  } catch (err) {
    console.error("GET /api/startups/trending error:", err);

    // Return empty array on error for graceful degradation
    return success([], {
      count: 0,
      limit: parseInt(new URL(req.url).searchParams.get("limit")) || 10,
      algorithm: "connection_activity",
      period: `last_${parseInt(new URL(req.url).searchParams.get("days")) || 7}_days`,
      error: true,
    });
  }
}
