import Message from "#root/models/Message.js";
import Connection from "#root/models/Connection.js";
import Notification from "#root/models/Notification.js";
import User from "#root/models/User.js";
import connectDB from "#root/lib/mongoose.js";

/**
 * Message Service - Handles all messaging-related operations
 */

export class MessageService {
  constructor() {
    // Ensure database connection
    connectDB();
  }

  /**
   * Send a message
   * @param {string} senderId - Sender user ID
   * @param {string} receiverId - Receiver user ID
   * @param {string} connectionId - Connection ID
   * @param {string} content - Message content
   * @param {object} options - Additional options
   * @returns {Promise<object>} Created message
   */
  async sendMessage(senderId, receiverId, connectionId, content, options = {}) {
    try {
      // Verify connection exists and is accepted
      const connection = await Connection.findById(connectionId);
      if (!connection) {
        throw new Error("Connection not found");
      }

      if (connection.status !== "accepted") {
        throw new Error("Can only send messages in accepted connections");
      }

      // Verify sender is part of the connection
      if (!connection.isUserInConnection(senderId)) {
        throw new Error("Unauthorized to send messages in this connection");
      }

      // Verify receiver is the other user in the connection
      const partnerId = connection.getPartner(senderId);
      if (partnerId.toString() !== receiverId) {
        throw new Error("Invalid receiver for this connection");
      }

      // Create message
      const message = new Message({
        senderId,
        receiverId,
        connectionId,
        content: content.trim(),
        messageType: options.messageType || "text",
        attachments: options.attachments || [],
        replyTo: options.replyTo || null,
      });

      await message.save();

      // Update connection last interaction
      connection.lastInteractionAt = new Date();
      await connection.save();

      // Create notification for receiver
      await Notification.createMessage(
        receiverId,
        senderId,
        message._id,
        connectionId,
      );

      // Populate sender info for response
      await message.populate("senderId", "full_name avatar");

      return {
        id: message._id.toString(),
        senderId: senderId,
        receiverId: receiverId,
        connectionId: connectionId,
        content: message.content,
        messageType: message.messageType,
        attachments: message.attachments,
        read: message.read,
        senderName: message.senderId.full_name,
        senderAvatar: message.senderId.avatar,
        createdAt: message.createdAt,
      };
    } catch (error) {
      console.error("sendMessage error:", error);
      throw error;
    }
  }

  /**
   * Get messages for a connection
   * @param {string} connectionId - Connection ID
   * @param {string} userId - User requesting messages
   * @param {object} options - Query options
   * @returns {Promise<Array>} Array of messages
   */
  async getConnectionMessages(connectionId, userId, options = {}) {
    try {
      // Verify connection exists and user has access
      const connection = await Connection.findById(connectionId);
      if (!connection) {
        throw new Error("Connection not found");
      }

      if (!connection.isUserInConnection(userId)) {
        throw new Error("Unauthorized access to messages");
      }

      if (connection.status !== "accepted") {
        throw new Error("Messages only available for accepted connections");
      }

      const { limit = 50, page = 1, markAsRead = false } = options;

      // Get messages
      const messages = await Message.getConnectionMessages(
        connectionId,
        limit,
        page,
      );

      // Mark messages as read if requested
      if (markAsRead) {
        await Message.markAsRead(connectionId, userId);
      }

      // Format response
      const formatted = messages.reverse().map((msg) => ({
        id: msg._id.toString(),
        senderId: msg.senderId._id.toString(),
        receiverId: msg.receiverId._id.toString(),
        connectionId: msg.connectionId.toString(),
        content: msg.content,
        messageType: msg.messageType,
        attachments: msg.attachments,
        read: msg.read,
        readAt: msg.readAt,
        senderName: msg.senderId.full_name,
        senderAvatar: msg.senderId.avatar,
        replyTo: msg.replyTo,
        createdAt: msg.createdAt,
        isOwn: msg.senderId._id.toString() === userId,
      }));

      return formatted;
    } catch (error) {
      console.error("getConnectionMessages error:", error);
      throw error;
    }
  }

  /**
   * Get message threads (connections with last message info)
   * @param {string} userId - User ID
   * @param {object} options - Query options
   * @returns {Promise<Array>} Array of message threads
   */
  async getMessageThreads(userId, options = {}) {
    try {
      const { limit = 20, page = 1 } = options;

      // Get accepted connections for the user
      const connections = await Connection.findUserConnections(
        userId,
        "accepted",
      );

      // Get thread data for each connection
      const threads = await Promise.all(
        connections.map(async (connection) => {
          const partnerId = connection.getPartner(userId);
          const partnerData =
            partnerId.toString() === connection.userA._id.toString()
              ? connection.userA
              : connection.userB;

          // Get last message
          const lastMessage = await Message.getLastMessage(connection._id);

          // Get unread count
          const unreadCount = await Message.countDocuments({
            connectionId: connection._id,
            receiverId: userId,
            read: false,
          });

          return {
            connectionId: connection._id.toString(),
            partnerId: partnerId.toString(),
            partnerName: partnerData.full_name,
            partnerAvatar: partnerData.avatar,
            partnerRole: partnerData.role,
            lastMessage: lastMessage
              ? {
                  id: lastMessage._id.toString(),
                  content: lastMessage.content,
                  senderId: lastMessage.senderId._id.toString(),
                  senderName: lastMessage.senderId.full_name,
                  createdAt: lastMessage.createdAt,
                  read: lastMessage.read,
                }
              : null,
            unreadCount,
            lastInteractionAt: connection.lastInteractionAt,
          };
        }),
      );

      // Sort by last interaction time
      threads.sort(
        (a, b) => new Date(b.lastInteractionAt) - new Date(a.lastInteractionAt),
      );

      // Apply pagination
      const skip = (page - 1) * limit;
      return threads.slice(skip, skip + limit);
    } catch (error) {
      console.error("getMessageThreads error:", error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   * @param {string} connectionId - Connection ID
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of messages marked as read
   */
  async markMessagesAsRead(connectionId, userId) {
    try {
      // Verify connection access
      const connection = await Connection.findById(connectionId);
      if (!connection) {
        throw new Error("Connection not found");
      }

      if (!connection.isUserInConnection(userId)) {
        throw new Error("Unauthorized access to connection");
      }

      const result = await Message.markAsRead(connectionId, userId);
      return result.modifiedCount;
    } catch (error) {
      console.error("markMessagesAsRead error:", error);
      throw error;
    }
  }

  /**
   * Get unread message count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread message count
   */
  async getUnreadMessageCount(userId) {
    try {
      return await Message.getUnreadCount(userId);
    } catch (error) {
      console.error("getUnreadMessageCount error:", error);
      throw error;
    }
  }

  /**
   * Delete a message (soft delete by marking as deleted)
   * @param {string} messageId - Message ID
   * @param {string} userId - User requesting deletion
   * @returns {Promise<boolean>} Success status
   */
  async deleteMessage(messageId, userId) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error("Message not found");
      }

      // Only sender can delete their own messages
      if (message.senderId.toString() !== userId) {
        throw new Error("Unauthorized to delete this message");
      }

      // Soft delete by updating content
      message.content = "[Message deleted]";
      message.messageType = "deleted";
      message.updatedAt = new Date();
      await message.save();

      return true;
    } catch (error) {
      console.error("deleteMessage error:", error);
      throw error;
    }
  }

  /**
   * Search messages in a connection
   * @param {string} connectionId - Connection ID
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<Array>} Array of matching messages
   */
  async searchMessages(connectionId, userId, query, options = {}) {
    try {
      // Verify connection access
      const connection = await Connection.findById(connectionId);
      if (!connection) {
        throw new Error("Connection not found");
      }

      if (!connection.isUserInConnection(userId)) {
        throw new Error("Unauthorized access to connection");
      }

      const { limit = 20 } = options;

      const messages = await Message.find({
        connectionId,
        content: { $regex: query, $options: "i" },
        messageType: { $ne: "deleted" },
      })
        .populate("senderId", "full_name avatar")
        .sort({ createdAt: -1 })
        .limit(limit);

      return messages.map((msg) => ({
        id: msg._id.toString(),
        senderId: msg.senderId._id.toString(),
        content: msg.content,
        senderName: msg.senderId.full_name,
        senderAvatar: msg.senderId.avatar,
        createdAt: msg.createdAt,
        isOwn: msg.senderId._id.toString() === userId,
      }));
    } catch (error) {
      console.error("searchMessages error:", error);
      throw error;
    }
  }

  /**
   * Get message statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<object>} Message statistics
   */
  async getMessageStats(userId) {
    try {
      const [totalSent, totalReceived, unreadCount, activeThreads] =
        await Promise.all([
          Message.countDocuments({ senderId: userId }),
          Message.countDocuments({ receiverId: userId }),
          Message.countDocuments({ receiverId: userId, read: false }),
          Connection.countDocuments({
            $or: [{ userA: userId }, { userB: userId }],
            status: "accepted",
          }),
        ]);

      return {
        totalSent,
        totalReceived,
        unreadCount,
        activeThreads,
        totalMessages: totalSent + totalReceived,
      };
    } catch (error) {
      console.error("getMessageStats error:", error);
      throw error;
    }
  }
}

// Export singleton instance
export default new MessageService();
