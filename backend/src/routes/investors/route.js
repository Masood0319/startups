import connectDB from "#root/lib/mongoose.js";
import User from "#root/models/User.js";
import Investor from "#root/models/Investor.js";
import { fail, ok } from "#root/lib/response.js";
import { requireAuthGuard } from "#root/lib/security/rbac.js";
import { validateSchema } from "#root/lib/security/validation.js";
import { isValidObjectId, toObjectId } from "#root/lib/security/objectId.js";

const INVESTOR_PROFILE_SCHEMA = {
  industries: { type: "array:string", maxItems: 25 },
  ticketSizeMin: { type: "number", min: 0 },
  ticketSizeMax: { type: "number", min: 0 },
  bio: { type: "string", max: 2000 },
};

function toIdString(value) {
  if (!value) return "";
  return typeof value === "string" ? value : value.toString();
}

export async function GET(req) {
  try {
    const auth = await requireAuthGuard(req);
    if (!auth.ok) return auth.response;

    const { userId } = auth;
    if (!isValidObjectId(userId)) {
      return fail("Invalid user id", 401);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    await connectDB();

    if (id) {
      if (!isValidObjectId(id)) {
        return fail("Invalid investor id", 400);
      }

      const userDoc = await User.findOne({
        _id: toObjectId(id),
        role: "investor",
      })
        .select("full_name role avatar location email")
        .lean();

      if (!userDoc || toIdString(userDoc._id) === userId) {
        return fail("Not found", 404);
      }

      const profile = await Investor.findOne({ userId: userDoc._id }).lean();

      return ok({
        investors: [
          {
            _id: toIdString(userDoc._id),
            full_name: userDoc.full_name,
            email: userDoc.email,
            role: userDoc.role,
            location: userDoc.location || "",
            avatar: userDoc.avatar || "",
            industries: profile?.industries || [],
            bio: profile?.bio || "",
            ticketSizeMin: profile?.ticketSizeMin ?? 0,
            ticketSizeMax: profile?.ticketSizeMax ?? 0,
          },
        ],
      });
    }

    const investorUsers = await User.find({
      role: "investor",
      _id: { $ne: toObjectId(userId) },
    })
      .select("full_name role avatar location email")
      .lean();

    const userIds = investorUsers.map((doc) => doc._id);
    const profiles = await Investor.find({ userId: { $in: userIds } }).lean();
    const profileByUserId = new Map(profiles.map((p) => [String(p.userId), p]));

    const investors = investorUsers.map((doc) => {
      const profile = profileByUserId.get(String(doc._id));
      return {
        _id: toIdString(doc._id),
        full_name: doc.full_name,
        email: doc.email,
        role: doc.role,
        location: doc.location || "",
        avatar: doc.avatar || "",
        industries: profile?.industries || [],
        bio: profile?.bio || "",
        ticketSizeMin: profile?.ticketSizeMin ?? 0,
        ticketSizeMax: profile?.ticketSizeMax ?? 0,
      };
    });

    return ok({ investors });
  } catch (err) {
    console.error("GET /api/investors error", err);
    return fail("Internal server error", 500);
  }
}

export async function POST(req) {
  try {
    const auth = await requireAuthGuard(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const validation = validateSchema(body, INVESTOR_PROFILE_SCHEMA, {
      stripUnknown: true,
    });

    if (!validation.success) {
      return fail(validation.error, 400);
    }

    await connectDB();

    const update = { ...validation.data };
    if (
      update.ticketSizeMin != null &&
      update.ticketSizeMax != null &&
      update.ticketSizeMin > update.ticketSizeMax
    ) {
      return fail("ticketSizeMin cannot be greater than ticketSizeMax", 400);
    }

    const profile = await Investor.findOneAndUpdate(
      { userId: toObjectId(auth.userId) },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return ok({ id: profile._id });
  } catch (err) {
    console.error("POST /api/investors error", err);
    return fail("Internal server error", 500);
  }
}
