import Notification from "#root/models/Notification.js";
import { getAuthContext } from "#root/lib/auth/authUtils.js";
import notificationService from "#root/services/notificationService.js";
import { ok, fail } from "#root/lib/response.js";
import { isValidObjectId, toObjectId } from "#root/lib/security/objectId.js";

export async function GET(req, { params }) {
  try {
    const { userId } = await getAuthContext(req);
    if (!userId) return fail("Authentication required", 401);

    const notificationId = params?.id;
    if (!notificationId) return fail("Notification ID is required", 400);
    if (!isValidObjectId(notificationId)) return fail("Invalid notification ID", 400);

    const notification = await Notification.findOne({
      _id: toObjectId(notificationId),
      userId: toObjectId(userId),
    }).lean();

    if (!notification) return fail("Notification not found or access denied", 404);
    return ok({ notification });
  } catch (error) {
    console.error("GET /api/notifications/[id] error:", error);
    return fail("Internal server error", 500);
  }
}

export async function PUT(req, { params }) {
  try {
    const { userId } = await getAuthContext(req);
    if (!userId) return fail("Authentication required", 401);

    const notificationId = params?.id;
    if (!notificationId) return fail("Notification ID is required", 400);

    const markedCount = await notificationService.markAsRead(userId, [notificationId]);
    if (markedCount === 0) return fail("Notification not found or already read", 404);

    return ok({ notificationId, markedCount });
  } catch (error) {
    console.error("PUT /api/notifications/[id] error:", error);
    return fail("Internal server error", 500);
  }
}

export async function PATCH(req, { params }) {
  try {
    const { userId } = await getAuthContext(req);
    if (!userId) return fail("Authentication required", 401);

    const notificationId = params?.id;
    const { action } = await req.json();

    if (!notificationId) return fail("Notification ID is required", 400);
    if (!action || !["archive", "unarchive", "mark_read"].includes(action)) {
      return fail("Action must be 'archive', 'unarchive', or 'mark_read'", 400);
    }

    if (action === "mark_read") {
      const markedCount = await notificationService.markAsRead(userId, [notificationId]);
      if (markedCount === 0) return fail("Notification not found or already read", 404);
      return ok({ notificationId, action, markedCount });
    }

    if (action === "archive") {
      const success = await notificationService.archiveNotification(notificationId, userId);
      if (!success) return fail("Notification not found or access denied", 404);
      return ok({ notificationId, action });
    }

    return fail("Unarchive functionality not yet implemented", 501);
  } catch (error) {
    console.error("PATCH /api/notifications/[id] error:", error);
    if (error.message.includes("Unauthorized")) {
      return fail("You are not authorized to modify this notification", 403);
    }
    return fail("Internal server error", 500);
  }
}

export async function DELETE(req, { params }) {
  try {
    const { userId } = await getAuthContext(req);
    if (!userId) return fail("Authentication required", 401);

    const notificationId = params?.id;
    if (!notificationId) return fail("Notification ID is required", 400);

    const success = await notificationService.deleteNotification(notificationId, userId);
    if (!success) return fail("Notification not found or access denied", 404);

    return ok({ notificationId });
  } catch (error) {
    console.error("DELETE /api/notifications/[id] error:", error);
    if (error.message.includes("Unauthorized")) {
      return fail("You are not authorized to delete this notification", 403);
    }
    return fail("Internal server error", 500);
  }
}
