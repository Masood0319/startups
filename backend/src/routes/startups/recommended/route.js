import { getAuthContext } from "#root/lib/auth/authUtils.js";
import connectDB from "#root/lib/mongoose.js";
import Startup from "#root/models/Startup.js";
import Connection from "#root/models/Connection.js";
import User from "#root/models/User.js";
import { success, error } from "#root/lib/response.js";

/**
 * GET /api/startups/recommended?limit=10
 * Get personalized startup recommendations for investors
 */
export async function GET(req) {
  try {
    // Authentication (optional for this endpoint, but better recommendations with it)
    const { user, userId } = await getAuthContext(req);

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit")) || 10;

    // Validate limit parameter
    if (limit < 1 || limit > 50) {
      return error("Limit must be between 1 and 50", 400);
    }

    await connectDB();

    let recommendedStartups = [];

    if (userId && user?.role === "investor") {
      // Get personalized recommendations for authenticated investor
      recommendedStartups = await getPersonalizedRecommendations(userId, limit);
    } else {
      // Get general recommendations (recent/popular startups)
      const generalStartups = await Startup.find({
        status: { $in: ["approved", "pending"] },
        visibility: { $in: ["public", "connections-only"] },
      })
        .sort({ createdAt: -1, viewCount: -1 })
        .limit(limit)
        .populate("userId", "full_name avatar")
        .lean();

      recommendedStartups = generalStartups.map((startup) => ({
        ...startup,
        _id: startup._id.toString(),
        userId: startup.userId?._id?.toString(),
        recommendationScore: 1, // Base score for general recommendations
      }));
    }

    // Add recommendation metadata
    const enrichedStartups = recommendedStartups.map((startup) => ({
      id: startup._id || startup.id,
      name: startup.name,
      sector: startup.industry || startup.sector,
      target: startup.fundingTarget || startup.target || 0,
      blurb: startup.description || startup.blurb || "Innovative startup",
      location: startup.geography || startup.location,
      founded: startup.foundedYear,
      employees: startup.teamSize,
      stage: startup.stage || "seed",
      valuation: startup.valuation,
      recommendationScore: startup.recommendationScore || 0,
      logo: startup.logoFileName,
      website: startup.website,
      industries: startup.industries || [startup.industry],
      createdAt: startup.createdAt,
    }));

    return success(enrichedStartups, {
      count: enrichedStartups.length,
      limit,
      personalized: !!userId,
      userRole: user?.role || "anonymous",
      algorithm: userId ? "preference_based" : "recency_based",
    });
  } catch (err) {
    console.error("GET /api/startups/recommended error:", err);

    // Fallback to basic mock data if database fails
    const fallbackStartups = [
      {
        id: "fallback-1",
        name: "TechVenture AI",
        sector: "Artificial Intelligence",
        target: 500000,
        blurb: "Next-generation AI solutions for enterprise",
        location: "San Francisco, CA",
        stage: "seed",
        recommendationScore: 0,
      },
      {
        id: "fallback-2",
        name: "GreenTech Solutions",
        sector: "CleanTech",
        target: 750000,
        blurb: "Sustainable energy solutions for the future",
        location: "Austin, TX",
        stage: "series-a",
        recommendationScore: 0,
      },
      {
        id: "fallback-3",
        name: "HealthConnect",
        sector: "HealthTech",
        target: 300000,
        blurb: "Connecting patients with healthcare providers",
        location: "Boston, MA",
        stage: "seed",
        recommendationScore: 0,
      },
    ];

    const requestedLimit =
      parseInt(new URL(req.url).searchParams.get("limit")) || 10;

    return success(fallbackStartups.slice(0, requestedLimit), {
      count: Math.min(fallbackStartups.length, requestedLimit),
      limit: requestedLimit,
      personalized: false,
      userRole: "anonymous",
      algorithm: "fallback",
    });
  }

  /**
   * Get personalized startup recommendations for an investor
   * @param {string} userId - Investor user ID
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} Array of recommended startups
   */
  async function getPersonalizedRecommendations(userId, limit) {
    try {
      // Get investor profile and preferences
      const investor = await User.findById(userId).lean();
      if (!investor) {
        throw new Error("Investor not found");
      }

      // Get startups the user already connected to
      const existingConnections = await Connection.find({
        $or: [{ userA: userId }, { userB: userId }],
      }).distinct("startupId");

      // Build recommendation query
      const query = {
        status: { $in: ["approved", "pending"] },
        visibility: { $in: ["public", "connections-only"] },
        _id: { $nin: existingConnections.filter((id) => id) }, // Exclude already connected startups
      };

      // Add industry preferences if available
      if (investor.industries && investor.industries.length > 0) {
        query.$or = [
          { industry: { $in: investor.industries } },
          { industries: { $in: investor.industries } },
        ];
      }

      // Get recommended startups
      const startups = await Startup.find(query)
        .sort({ createdAt: -1, viewCount: -1, connectionCount: -1 })
        .limit(limit * 2) // Get more to allow for scoring
        .populate("userId", "full_name avatar location")
        .lean();

      // Score recommendations based on match criteria
      const scoredStartups = startups.map((startup) => {
        let score = 1; // Base score

        // Industry match bonus
        if (investor.industries) {
          if (investor.industries.includes(startup.industry)) score += 3;
          if (
            startup.industries &&
            startup.industries.some((ind) => investor.industries.includes(ind))
          )
            score += 2;
        }

        // Location match bonus
        if (investor.location && startup.geography === investor.location)
          score += 2;

        // Recent activity bonus
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        if (startup.createdAt > oneMonthAgo) score += 1;

        // Popularity bonus
        if (startup.viewCount > 100) score += 1;
        if (startup.connectionCount > 5) score += 1;

        return {
          ...startup,
          _id: startup._id.toString(),
          userId: startup.userId?._id?.toString(),
          recommendationScore: score,
        };
      });

      // Sort by score and return top recommendations
      return scoredStartups
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);
    } catch (error) {
      console.error("getPersonalizedRecommendations error:", error);

      // Fallback to general recommendations
      const fallbackStartups = await Startup.find({
        status: { $in: ["approved", "pending"] },
        visibility: { $in: ["public", "connections-only"] },
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("userId", "full_name avatar")
        .lean();

      return fallbackStartups.map((startup) => ({
        ...startup,
        _id: startup._id.toString(),
        userId: startup.userId?._id?.toString(),
        recommendationScore: 1,
      }));
    }
  }
}
