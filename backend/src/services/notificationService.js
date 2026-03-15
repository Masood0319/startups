import Notification from "#root/models/Notification.js";
import User from "#root/models/User.js";
import connectDB from "#root/lib/mongoose.js";

/**
 * Notification Service - Handles all notification-related operations
 */

export class NotificationService {
  constructor() {
    // Ensure database connection
    connectDB();
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {object} options - Query options
   * @returns {Promise<Array>} Array of notifications
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        limit = 50,
        page = 1,
        unreadOnly = false,
        type = null,
        includeArchived = false,
      } = options;

      const notifications = await Notification.getUserNotifications(userId, {
        limit,
        page,
        unreadOnly,
        type,
        includeArchived,
      });

      return notifications.map((notification) => ({
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        read: notification.read,
        readAt: notification.readAt,
        priority: notification.priority,
        actionRequired: notification.actionRequired,
        actionUrl: notification.actionUrl,
        relatedUser: notification.relatedUserId
          ? {
              id: notification.relatedUserId._id.toString(),
              name: notification.relatedUserId.full_name,
              avatar: notification.relatedUserId.avatar,
              role: notification.relatedUserId.role,
            }
          : null,
        relatedConnection: notification.relatedConnectionId
          ? {
              id: notification.relatedConnectionId._id.toString(),
            }
          : null,
        relatedStartup: notification.relatedStartupId
          ? {
              id: notification.relatedStartupId._id.toString(),
              name: notification.relatedStartupId.name,
              description: notification.relatedStartupId.description,
            }
          : null,
        createdAt: notification.createdAt,
        expiresAt: notification.expiresAt,
      }));
    } catch (error) {
      console.error("getUserNotifications error:", error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread notification count
   */
  async getUnreadCount(userId) {
    try {
      return await Notification.getUnreadCount(userId);
    } catch (error) {
      console.error("getUnreadCount error:", error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   * @param {string} userId - User ID
   * @param {Array} notificationIds - Optional array of specific notification IDs
   * @returns {Promise<number>} Number of notifications marked as read
   */
  async markAsRead(userId, notificationIds = null) {
    try {
      const result = await Notification.markAsRead(userId, notificationIds);
      return result.modifiedCount;
    } catch (error) {
      console.error("markAsRead error:", error);
      throw error;
    }
  }

  /**
   * Create a connection request notification
   * @param {string} recipientId - Recipient user ID
   * @param {string} senderId - Sender user ID
   * @param {string} connectionId - Connection ID
   * @returns {Promise<object>} Created notification
   */
  async createConnectionRequestNotification(
    recipientId,
    senderId,
    connectionId,
  ) {
    try {
      const sender = await User.findById(senderId);
      if (!sender) {
        throw new Error("Sender not found");
      }

      const notification = await Notification.createConnectionRequest(
        recipientId,
        senderId,
        connectionId,
      );

      // Populate for response
      await notification.populate("relatedUserId", "full_name avatar role");

      return {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: `${sender.full_name} sent you a connection request`,
        read: notification.read,
        actionRequired: notification.actionRequired,
        actionUrl: notification.actionUrl,
        createdAt: notification.createdAt,
      };
    } catch (error) {
      console.error("createConnectionRequestNotification error:", error);
      throw error;
    }
  }

  /**
   * Create a connection accepted notification
   * @param {string} recipientId - Recipient user ID
   * @param {string} acceptedById - User who accepted the connection
   * @param {string} connectionId - Connection ID
   * @returns {Promise<object>} Created notification
   */
  async createConnectionAcceptedNotification(
    recipientId,
    acceptedById,
    connectionId,
  ) {
    try {
      const acceptedBy = await User.findById(acceptedById);
      if (!acceptedBy) {
        throw new Error("User who accepted not found");
      }

      const notification = await Notification.createConnectionAccepted(
        recipientId,
        acceptedById,
        connectionId,
      );

      return {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: `${acceptedBy.full_name} accepted your connection request`,
        read: notification.read,
        actionUrl: notification.actionUrl,
        createdAt: notification.createdAt,
      };
    } catch (error) {
      console.error("createConnectionAcceptedNotification error:", error);
      throw error;
    }
  }

  /**
   * Create a new message notification
   * @param {string} recipientId - Recipient user ID
   * @param {string} senderId - Sender user ID
   * @param {string} messageId - Message ID
   * @param {string} connectionId - Connection ID
   * @returns {Promise<object>} Created notification
   */
  async createMessageNotification(
    recipientId,
    senderId,
    messageId,
    connectionId,
  ) {
    try {
      const sender = await User.findById(senderId);
      if (!sender) {
        throw new Error("Sender not found");
      }

      const notification = await Notification.createMessage(
        recipientId,
        senderId,
        messageId,
        connectionId,
      );

      return {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: `${sender.full_name} sent you a message`,
        read: notification.read,
        actionUrl: notification.actionUrl,
        createdAt: notification.createdAt,
      };
    } catch (error) {
      console.error("createMessageNotification error:", error);
      throw error;
    }
  }

  /**
   * Create a system notification
   * @param {string} userId - User ID
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {object} options - Additional options
   * @returns {Promise<object>} Created notification
   */
  async createSystemNotification(userId, title, message, options = {}) {
    try {
      const notification = await Notification.createNotification({
        userId,
        type: "system",
        title,
        message,
        data: options.data || {},
        priority: options.priority || "normal",
        actionRequired: options.actionRequired || false,
        actionUrl: options.actionUrl || null,
        expiresAt: options.expiresAt || null,
      });

      return {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        createdAt: notification.createdAt,
      };
    } catch (error) {
      console.error("createSystemNotification error:", error);
      throw error;
    }
  }

  /**
   * Create a generic notification.
   * @param {string} userId
   * @param {string} type
   * @param {string} referenceId
   * @param {object} metadata
   * @returns {Promise<object>}
   */
  async createNotification(userId, type, referenceId = null, metadata = {}) {
    try {
      const notification = await Notification.createNotification({
        userId,
        type,
        title: metadata.title || "Payment Update",
        message: metadata.message || "A payment event occurred.",
        data: {
          referenceId: referenceId || null,
          ...(metadata.data || {}),
        },
        actionUrl: metadata.actionUrl || null,
        priority: metadata.priority || "normal",
        relatedUserId: metadata.relatedUserId || null,
        relatedConnectionId: metadata.relatedConnectionId || null,
        relatedMessageId: metadata.relatedMessageId || null,
        relatedStartupId: metadata.relatedStartupId || null,
      });

      return {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
      };
    } catch (error) {
      console.error("createNotification error:", error);
      throw error;
    }
  }

  /**
   * Archive a notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} Success status
   */
  async archiveNotification(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);

      if (!notification) {
        throw new Error("Notification not found");
      }

      if (!notification.belongsToUser(userId)) {
        throw new Error("Unauthorized to archive this notification");
      }

      notification.archived = true;
      notification.archivedAt = new Date();
      await notification.save();

      return true;
    } catch (error) {
      console.error("archiveNotification error:", error);
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} Success status
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);

      if (!notification) {
        throw new Error("Notification not found");
      }

      if (!notification.belongsToUser(userId)) {
        throw new Error("Unauthorized to delete this notification");
      }

      await Notification.findByIdAndDelete(notificationId);
      return true;
    } catch (error) {
      console.error("deleteNotification error:", error);
      throw error;
    }
  }

  /**
   * Get notification summary for a user
   * @param {string} userId - User ID
   * @returns {Promise<object>} Notification summary
   */
  async getNotificationSummary(userId) {
    try {
      const [
        totalUnread,
        connectionRequests,
        unreadMessages,
        systemNotifications,
      ] = await Promise.all([
        Notification.getUnreadCount(userId),
        Notification.countDocuments({
          userId,
          type: "connection_request",
          read: false,
          archived: false,
        }),
        Notification.countDocuments({
          userId,
          type: "message",
          read: false,
          archived: false,
        }),
        Notification.countDocuments({
          userId,
          type: "system",
          read: false,
          archived: false,
        }),
      ]);

      return {
        totalUnread,
        byType: {
          connectionRequests,
          messages: unreadMessages,
          system: systemNotifications,
        },
        hasUnread: totalUnread > 0,
      };
    } catch (error) {
      console.error("getNotificationSummary error:", error);
      throw error;
    }
  }

  /**
   * Clean up expired notifications
   * @returns {Promise<number>} Number of notifications cleaned up
   */
  async cleanupExpiredNotifications() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() },
      });

      console.log(`Cleaned up ${result.deletedCount} expired notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error("cleanupExpiredNotifications error:", error);
      throw error;
    }
  }

  /**
   * Bulk create notifications for multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {object} notificationData - Notification data
   * @returns {Promise<Array>} Created notifications
   */
  async bulkCreateNotifications(userIds, notificationData) {
    try {
      const notifications = userIds.map((userId) => ({
        ...notificationData,
        userId,
      }));

      const createdNotifications = await Notification.insertMany(notifications);

      return createdNotifications.map((notification) => ({
        id: notification._id.toString(),
        userId: notification.userId.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt,
      }));
    } catch (error) {
      console.error("bulkCreateNotifications error:", error);
      throw error;
    }
  }
}

// Export singleton instance
export default new NotificationService();
