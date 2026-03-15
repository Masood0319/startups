import { getAuthContext } from "#root/lib/auth/authUtils.js";
import notificationService from "#root/services/notificationService.js";
import { ok, fail } from "#root/lib/response.js";

export async function GET(req) {
  try {
    const { user, userId } = await getAuthContext(req);
    if (!user || !userId) return fail("Authentication required", 401);

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type");
    const includeArchived = searchParams.get("includeArchived") === "true";

    if (limit < 1 || limit > 100) return fail("Limit must be between 1 and 100", 400);
    if (page < 1) return fail("Page must be greater than 0", 400);

    const validTypes = [
      "connection_request",
      "connection_accepted",
      "connection_declined",
      "message",
      "system",
      "investment_interest",
      "profile_view",
      "payment_sent",
      "payment_received",
      "payment_failed",
      "payment_canceled",
      "payment_refunded",
    ];
    if (type && !validTypes.includes(type)) {
      return fail(`Invalid notification type. Must be one of: ${validTypes.join(", ")}`, 400);
    }

    const [notifications, summary] = await Promise.all([
      notificationService.getUserNotifications(userId, {
        limit,
        page,
        unreadOnly,
        type,
        includeArchived,
      }),
      notificationService.getNotificationSummary(userId),
    ]);

    return ok({
      notifications,
      summary,
      meta: {
        count: notifications.length,
        page,
        limit,
        unreadOnly,
        type: type || "all",
        includeArchived,
      },
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return fail("Internal server error", 500);
  }
}

export async function PUT(req) {
  return markNotificationsAsRead(req);
}

export async function PATCH(req) {
  return markNotificationsAsRead(req);
}

async function markNotificationsAsRead(req) {
  try {
    const { userId } = await getAuthContext(req);
    if (!userId) return fail("Authentication required", 401);

    const { notificationIds } = await req.json();

    if (notificationIds && !Array.isArray(notificationIds)) {
      return fail("notificationIds must be an array", 400);
    }
    if (notificationIds && notificationIds.length === 0) {
      return fail("notificationIds array cannot be empty", 400);
    }

    const markedCount = await notificationService.markAsRead(userId, notificationIds);
    return ok({ markedCount, specificIds: !!notificationIds });
  } catch (error) {
    console.error("PUT/PATCH /api/notifications error:", error);
    return fail("Internal server error", 500);
  }
}

export async function POST(req) {
  try {
    const { user, userId } = await getAuthContext(req);
    if (!user || !userId) return fail("Authentication required", 401);

    if (user.role !== "fund_manager") {
      return fail("Insufficient permissions to create system notifications", 403);
    }

    const {
      title,
      message,
      priority,
      actionRequired,
      actionUrl,
      data,
      expiresAt,
      targetUserId,
    } = await req.json();

    if (!title || !message) return fail("Title and message are required", 400);
    if (title.length > 100) return fail("Title must be 100 characters or less", 400);
    if (message.length > 500) return fail("Message must be 500 characters or less", 400);

    const validPriorities = ["low", "normal", "high", "urgent"];
    if (priority && !validPriorities.includes(priority)) {
      return fail(`Priority must be one of: ${validPriorities.join(", ")}`, 400);
    }

    const recipientId = targetUserId || userId;
    const notification = await notificationService.createSystemNotification(
      recipientId,
      title,
      message,
      {
        priority,
        actionRequired,
        actionUrl,
        data,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    );

    return ok({ notification }, 201);
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return fail("Internal server error", 500);
  }
}
