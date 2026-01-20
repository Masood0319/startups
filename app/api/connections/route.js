import { NextResponse } from "next/server";
import { verifyToken, getConnectionsCollection, getUsersCollection } from "@/lib/dbUtils";

// =======================================================
// GET /api/connections?status=requested|accepted|rejected
// =======================================================
export async function GET(req) {
  const userId = await verifyToken();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // requested | accepted | rejected | withdrawn

    const connectionsDB = await getConnectionsCollection();
    const usersDB = await getUsersCollection();

    const query = {
      $or: [{ fromUserId: userId }, { toUserId: userId }],
      ...(status && { status })
    };

    const connections = await connectionsDB.find(query).sort({ createdAt: -1 }).toArray();

    const formatted = await Promise.all(
      connections.map(async (conn) => {
        const isSender = conn.fromUserId === userId;
        const partnerId = isSender ? conn.toUserId : conn.fromUserId;
        const partner = await usersDB.findOne({ _id: partnerId });

        return {
          id: conn._id,
          direction: isSender ? "outbound" : "inbound", // LinkedIn-style
          status: conn.status,
          partnerId,
          partnerName: partner?.name || "Unknown",
          partnerRole: partner?.role || "User",
          startupId: conn.startupId || null,
          roundType: conn.roundType || null,
          shortPitch: conn.shortPitch || null,
          createdAt: conn.createdAt
        };
      })
    );

    return NextResponse.json(formatted, { status: 200 });
  } catch (err) {
    console.error("GET /api/connections error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// =================================
// POST /api/connections (Send)
// =================================
export async function POST(req) {
  const userId = await verifyToken();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { toUserId, startupId, roundType, shortPitch } = await req.json();

    if (!toUserId || !shortPitch) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (toUserId === userId) {
      return NextResponse.json({ message: "Cannot connect to yourself" }, { status: 400 });
    }

    const connectionsDB = await getConnectionsCollection();

    // Prevent duplicate active requests
    const existing = await connectionsDB.findOne({
      fromUserId: userId,
      toUserId,
      status: { $in: ["requested", "accepted"] }
    });

    if (existing) {
      return NextResponse.json({ message: "Connection already exists" }, { status: 409 });
    }

    const connection = {
      fromUserId: userId,
      toUserId,
      startupId: startupId || null,
      roundType: roundType || null,
      shortPitch,
      status: "requested",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await connectionsDB.insertOne(connection);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("POST /api/connections error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
