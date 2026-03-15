import { getAuthContext } from "#root/lib/auth/authUtils.js";
import connectionService from "#root/services/connectionService.js";
import { ok, fail } from "#root/lib/response.js";
import { failFromConnectionError } from "#root/routes/connections/_utils/connectionErrors.js";
import {
  isKnownConnectionStatus,
  normalizeConnectionStatus,
} from "#root/services/connectionTransitionGuard.js";

export async function GET(req) {
  try {
    const { userId } = await getAuthContext(req);
    if (!userId) return fail("Authentication required", 401);

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const status = statusParam ? normalizeConnectionStatus(statusParam) : null;

    if (status && !isKnownConnectionStatus(status)) {
      return fail(
        {
          code: "INVALID_STATUS",
          message: "Invalid status parameter",
        },
        400,
      );
    }

    const connections = await connectionService.getUserConnections(userId, status);
    return ok({ connections, meta: { count: connections.length, status: status || "all" } });
  } catch (error) {
    console.error("GET /api/connections error:", error);
    return failFromConnectionError(error);
  }
}

export async function POST(req) {
  try {
    const { userId } = await getAuthContext(req);
    if (!userId) return fail("Authentication required", 401);

    const body = await req.json();
    const { toUserId, targetProfileId, startupId, roundType, shortPitch, message } = body;
    const recipientId = toUserId || targetProfileId;

    if (!recipientId) return fail("Recipient user ID is required", 400);
    if (!shortPitch && !message) return fail("Message or short pitch is required", 400);
    if (recipientId === userId) return fail("Cannot send connection request to yourself", 400);

    const messageText = shortPitch || message;
    if (messageText.length > 500) return fail("Message too long (max 500 characters)", 400);

    const connection = await connectionService.createConnection(userId, recipientId, {
      startupId,
      roundType,
      shortPitch: shortPitch || message,
      message: messageText,
    });

    return ok({ connection }, 201);
  } catch (error) {
    console.error("POST /api/connections error:", error);
    return failFromConnectionError(error);
  }
}

export async function PUT(req) {
  try {
    const { userId } = await getAuthContext(req);
    if (!userId) return fail("Authentication required", 401);

    const { connectionId, status } = await req.json();
    if (!connectionId) return fail("Connection ID is required", 400);
    if (!status) return fail("Status is required", 400);

    const connection = await connectionService.updateConnectionStatus(connectionId, userId, status);
    return ok({ connection });
  } catch (error) {
    console.error("PUT /api/connections error:", error);
    return failFromConnectionError(error);
  }
}
