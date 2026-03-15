import { getAuthContext } from "#root/lib/auth/authUtils.js";
import notificationService from "#root/services/notificationService.js";
import messageService from "#root/services/messageService.js";
import connectionService from "#root/services/connectionService.js";
import { ok, fail } from "#root/lib/response.js";

export async function GET(req) {
  try {
    const { userId } = await getAuthContext(req);
    if (!userId) return fail("Authentication required", 401);

    const [notificationSummary, unreadMessageCount, connectionStats] = await Promise.all([
      notificationService.getNotificationSummary(userId),
      messageService.getUnreadMessageCount(userId),
      connectionService.getConnectionStats(userId),
    ]);

    const totalUnread = notificationSummary.totalUnread + unreadMessageCount;

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentNotifications = await notificationService.getUserNotifications(userId, {
      limit: 100,
      page: 1,
    });

    const recentCount = recentNotifications.filter(
      (notification) => new Date(notification.createdAt) >= oneDayAgo,
    ).length;

    return ok({
      totalUnread,
      unreadNotifications: notificationSummary.totalUnread,
      unreadMessages: unreadMessageCount,
      notifications: {
        total: notificationSummary.totalUnread,
        connectionRequests: notificationSummary.byType.connectionRequests,
        messages: notificationSummary.byType.messages,
        system: notificationSummary.byType.system,
        hasUnread: notificationSummary.hasUnread,
      },
      connections: {
        pending: connectionStats.pending,
        accepted: connectionStats.accepted,
        total: connectionStats.total,
        successRate: connectionStats.successRate,
      },
      activity: {
        recentCount,
        period: "24h",
      },
      actionItems: {
        connectionRequestsToReview: notificationSummary.byType.connectionRequests,
        unreadMessagesToRead: unreadMessageCount,
        systemNotificationsToCheck: notificationSummary.byType.system,
      },
      hasAnyActivity: totalUnread > 0 || recentCount > 0,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET /api/notifications/summary error:", error);
    return fail("Internal server error", 500);
  }
}

export async function POST(req) {
  try {
    const { userId } = await getAuthContext(req);
    if (!userId) return fail("Authentication required", 401);

    const { type } = await req.json();
    const validTypes = ["all", "notifications", "messages"];
    if (type && !validTypes.includes(type)) {
      return fail(`Invalid type. Must be one of: ${validTypes.join(", ")}`, 400);
    }

    let markedNotifications = 0;
    let markedMessages = 0;

    if (!type || type === "all" || type === "notifications") {
      markedNotifications = await notificationService.markAsRead(userId);
    }

    if (!type || type === "all" || type === "messages") {
      const connections = await connectionService.getUserConnections(userId, "accepted");
      for (const connection of connections) {
        const marked = await messageService.markMessagesAsRead(connection.id, userId);
        markedMessages += marked;
      }
    }

    return ok({
      markedNotifications,
      markedMessages,
      total: markedNotifications + markedMessages,
      type: type || "all",
    });
  } catch (error) {
    console.error("POST /api/notifications/summary error:", error);
    return fail("Internal server error", 500);
  }
}
