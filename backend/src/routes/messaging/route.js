import { getAuthContext } from "#root/lib/auth/authUtils.js";
import messageService from "#root/services/messageService.js";
import { ok, fail } from "#root/lib/response.js";

export async function POST(req) {
  try {
    const { userId } = await getAuthContext(req);
    if (!userId) return fail("Authentication required", 401);

    const { connectionId, receiverId, content, messageType, attachments, replyTo } = await req.json();

    if (!connectionId || !receiverId || !content) {
      return fail("Connection ID, receiver ID, and message content are required", 400);
    }
    if (content.trim().length === 0) return fail("Message content cannot be empty", 400);
    if (content.length > 2000) return fail("Message content too long (max 2000 characters)", 400);
    if (receiverId === userId) return fail("Cannot send message to yourself", 400);

    const message = await messageService.sendMessage(userId, receiverId, connectionId, content, {
      messageType,
      attachments,
      replyTo,
    });

    return ok({ message }, 201);
  } catch (error) {
    console.error("POST /api/messaging error:", error);
    if (error.message.includes("Connection not found")) return fail("Connection not found", 404);
    if (error.message.includes("Unauthorized")) return fail("You are not authorized to send messages in this connection", 403);
    if (error.message.includes("accepted connections")) return fail("Messages can only be sent in accepted connections", 403);
    if (error.message.includes("Invalid receiver")) return fail("Invalid receiver for this connection", 400);
    return fail("Internal server error", 500);
  }
}

export async function GET(req) {
  try {
    const { userId } = await getAuthContext(req);
    if (!userId) return fail("Authentication required", 401);

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    if (limit < 1 || limit > 100) return fail("Limit must be between 1 and 100", 400);
    if (page < 1) return fail("Page must be greater than 0", 400);

    const threads = await messageService.getMessageThreads(userId, { limit, page });
    return ok({ threads, meta: { count: threads.length, page, limit } });
  } catch (error) {
    console.error("GET /api/messaging error:", error);
    return fail("Internal server error", 500);
  }
}

export async function PUT(req) {
  try {
    const { userId } = await getAuthContext(req);
    if (!userId) return fail("Authentication required", 401);

    const { connectionId } = await req.json();
    if (!connectionId) return fail("Connection ID is required", 400);

    const markedCount = await messageService.markMessagesAsRead(connectionId, userId);
    return ok({ markedCount, connectionId });
  } catch (error) {
    console.error("PUT /api/messaging error:", error);
    if (error.message.includes("Connection not found")) return fail("Connection not found", 404);
    if (error.message.includes("Unauthorized")) return fail("You are not authorized to access this connection", 403);
    return fail("Internal server error", 500);
  }
}
