import Connection from "#root/models/Connection.js";
import User from "#root/models/User.js";
import Notification from "#root/models/Notification.js";
import connectDB from "#root/lib/mongoose.js";
import {
  CONNECTION_STATUS,
  assertConnectionTransition,
  isKnownConnectionStatus,
  normalizeConnectionStatus,
} from "#root/services/connectionTransitionGuard.js";

/**
 * Connection Service - Handles all connection-related operations
 */
export class ConnectionServiceError extends Error {
  constructor(code, message, status = 400, details = null) {
    super(message);
    this.name = "ConnectionServiceError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ConnectionService {
  constructor() {
    // Ensure database connection
    connectDB();
  }

  /**
   * Get all connections for a user
   * @param {string} userId - User ID
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>} Array of connections with partner info
   */
  async getUserConnections(userId, status = null) {
    try {
      const normalizedStatus = status
        ? normalizeConnectionStatus(status)
        : null;
      if (status && !isKnownConnectionStatus(normalizedStatus)) {
        throw new ConnectionServiceError(
          "INVALID_STATUS",
          "Invalid connection status filter",
          400,
        );
      }

      const connections = await Connection.findUserConnections(
        userId,
        normalizedStatus,
      );

      // Format response with partner information
      const formatted = connections.map((conn) => {
        const partner = conn.getPartner(userId);
        const partnerData =
          partner === conn.userA._id.toString() ? conn.userA : conn.userB;

        return {
          id: conn._id.toString(),
          partnerId: partner.toString(),
          partnerName: partnerData.full_name,
          partnerEmail: partnerData.email,
          partnerRole: partnerData.role,
          partnerAvatar: partnerData.avatar,
          status: normalizeConnectionStatus(conn.status),
          message: conn.message,
          shortPitch: conn.shortPitch,
          roundType: conn.roundType,
          direction:
            conn.initiatedBy.toString() === userId ? "outbound" : "inbound",
          startupId: conn.startupId?.toString() || null,
          createdAt: conn.createdAt,
          updatedAt: conn.updatedAt,
          lastInteractionAt: conn.lastInteractionAt,
        };
      });

      return formatted;
    } catch (error) {
      console.error("getUserConnections error:", error);
      throw error;
    }
  }

  /**
   * Create a new connection request
   * @param {string} fromUserId - Sender user ID
   * @param {string} toUserId - Receiver user ID
   * @param {object} data - Connection data
   * @returns {Promise<object>} Created connection
   */
  async createConnection(fromUserId, toUserId, data = {}) {
    try {
      // Check if connection already exists
      const existsAlready = await Connection.connectionExists(
        fromUserId,
        toUserId,
      );
      if (existsAlready) {
        throw new ConnectionServiceError(
          "DUPLICATE_CONNECTION",
          "Connection already exists between these users",
          409,
        );
      }

      // Verify both users exist
      const [fromUser, toUser] = await Promise.all([
        User.findById(fromUserId),
        User.findById(toUserId),
      ]);

      if (!fromUser || !toUser) {
        throw new ConnectionServiceError(
          "USER_NOT_FOUND",
          "One or both users not found",
          404,
        );
      }

      // Create connection
      const connection = new Connection({
        userA: fromUserId,
        userB: toUserId,
        initiatedBy: fromUserId,
        status: "pending",
        message: data.message || data.shortPitch || "",
        shortPitch: data.shortPitch,
        startupId: data.startupId || null,
        roundType: data.roundType || null,
      });

      try {
        await connection.save();
      } catch (saveError) {
        if (saveError?.code === 11000) {
          throw new ConnectionServiceError(
            "DUPLICATE_CONNECTION",
            "Connection already exists between these users",
            409,
          );
        }
        throw saveError;
      }

      // Create notification for recipient
      await Notification.createConnectionRequest(
        toUserId,
        fromUserId,
        connection._id,
      );

      return {
        id: connection._id.toString(),
        status: normalizeConnectionStatus(connection.status),
        createdAt: connection.createdAt,
        message: connection.message,
      };
    } catch (error) {
      console.error("createConnection error:", error);
      throw error;
    }
  }

  /**
   * Update connection status (accept, reject, withdraw)
   * @param {string} connectionId - Connection ID
   * @param {string} userId - User performing the action
   * @param {string} newStatus - New status
   * @returns {Promise<object>} Updated connection
   */
  async updateConnectionStatus(connectionId, userId, newStatus) {
    try {
      const requestedStatus = normalizeConnectionStatus(newStatus);
      if (!isKnownConnectionStatus(requestedStatus)) {
        throw new ConnectionServiceError(
          "INVALID_STATUS",
          "Invalid status",
          400,
        );
      }

      const connection = await Connection.findById(connectionId).select(
        "_id userA userB initiatedBy status __v",
      );

      if (!connection) {
        throw new ConnectionServiceError(
          "CONNECTION_NOT_FOUND",
          "Connection not found",
          404,
        );
      }

      // Verify user is authorized
      if (!connection.isUserInConnection(userId)) {
        throw new ConnectionServiceError(
          "UNAUTHORIZED",
          "Unauthorized to modify this connection",
          403,
        );
      }

      // Additional validation based on current status and user
      if (
        requestedStatus === CONNECTION_STATUS.WITHDRAWN &&
        connection.initiatedBy.toString() !== userId
      ) {
        throw new ConnectionServiceError(
          "UNAUTHORIZED_TRANSITION",
          "Only the connection initiator can withdraw the request",
          403,
        );
      }

      if (
        (requestedStatus === CONNECTION_STATUS.ACCEPTED ||
          requestedStatus === CONNECTION_STATUS.REJECTED) &&
        connection.initiatedBy.toString() === userId
      ) {
        throw new ConnectionServiceError(
          "UNAUTHORIZED_TRANSITION",
          "Cannot accept or reject your own connection request",
          403,
        );
      }

      const transitionCheck = assertConnectionTransition(
        connection.status,
        requestedStatus,
      );
      if (!transitionCheck.ok) {
        throw new ConnectionServiceError(
          "INVALID_TRANSITION",
          `Invalid status transition from ${transitionCheck.from} to ${transitionCheck.to}`,
          409,
          {
            from: transitionCheck.from,
            to: transitionCheck.to,
            allowed: transitionCheck.allowed,
          },
        );
      }

      const now = new Date();
      const updatedConnection = await Connection.findOneAndUpdate(
        {
          _id: connection._id,
          status: connection.status,
          __v: connection.__v,
        },
        {
          $set: {
            status: requestedStatus,
            respondedAt: now,
            lastInteractionAt: now,
            updatedAt: now,
          },
          $inc: { __v: 1 },
        },
        { new: true },
      );

      if (!updatedConnection) {
        throw new ConnectionServiceError(
          "VERSION_CONFLICT",
          "Connection was modified by another request. Retry with latest status.",
          409,
        );
      }

      // Create appropriate notification
      if (requestedStatus === CONNECTION_STATUS.ACCEPTED) {
        await Notification.createConnectionAccepted(
          updatedConnection.initiatedBy,
          userId,
          updatedConnection._id,
        );
      }

      return {
        id: updatedConnection._id.toString(),
        status: normalizeConnectionStatus(updatedConnection.status),
        updatedAt: updatedConnection.updatedAt,
        respondedAt: updatedConnection.respondedAt,
      };
    } catch (error) {
      console.error("updateConnectionStatus error:", error);
      throw error;
    }
  }

  /**
   * Get connection by ID with authorization check
   * @param {string} connectionId - Connection ID
   * @param {string} userId - User requesting the connection
   * @returns {Promise<object>} Connection data
   */
  async getConnectionById(connectionId, userId) {
    try {
      const connection = await Connection.findById(connectionId)
        .populate("userA", "full_name email role avatar")
        .populate("userB", "full_name email role avatar")
        .populate("startupId", "name description industry");

      if (!connection) {
        throw new ConnectionServiceError(
          "CONNECTION_NOT_FOUND",
          "Connection not found",
          404,
        );
      }

      if (!connection.isUserInConnection(userId)) {
        throw new ConnectionServiceError(
          "UNAUTHORIZED",
          "Unauthorized access to this connection",
          403,
        );
      }

      const partner = connection.getPartner(userId);
      const partnerData =
        partner.toString() === connection.userA._id.toString()
          ? connection.userA
          : connection.userB;

      return {
        id: connection._id.toString(),
        partnerId: partner.toString(),
        partnerName: partnerData.full_name,
        partnerEmail: partnerData.email,
        partnerRole: partnerData.role,
        partnerAvatar: partnerData.avatar,
        status: normalizeConnectionStatus(connection.status),
        message: connection.message,
        shortPitch: connection.shortPitch,
        roundType: connection.roundType,
        startupData: connection.startupId,
        direction:
          connection.initiatedBy.toString() === userId ? "outbound" : "inbound",
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt,
        lastInteractionAt: connection.lastInteractionAt,
      };
    } catch (error) {
      console.error("getConnectionById error:", error);
      throw error;
    }
  }

  /**
   * Get connection statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<object>} Connection statistics
   */
  async getConnectionStats(userId) {
    try {
      const [
        totalConnections,
        pendingConnections,
        acceptedConnections,
        declinedConnections,
        rejectedConnections,
      ] = await Promise.all([
        Connection.countDocuments({
          $or: [{ userA: userId }, { userB: userId }],
        }),
        Connection.countDocuments({
          $or: [{ userA: userId }, { userB: userId }],
          status: "pending",
        }),
        Connection.countDocuments({
          $or: [{ userA: userId }, { userB: userId }],
          status: "accepted",
        }),
        Connection.countDocuments({
          $or: [{ userA: userId }, { userB: userId }],
          status: "declined",
        }),
        Connection.countDocuments({
          $or: [{ userA: userId }, { userB: userId }],
          status: CONNECTION_STATUS.REJECTED,
        }),
      ]);

      const finalRejectedConnections =
        rejectedConnections + declinedConnections;

      return {
        total: totalConnections,
        pending: pendingConnections,
        accepted: acceptedConnections,
        rejected: finalRejectedConnections,
        declined: finalRejectedConnections,
        successRate:
          totalConnections > 0
            ? Math.round((acceptedConnections / totalConnections) * 100)
            : 0,
      };
    } catch (error) {
      console.error("getConnectionStats error:", error);
      throw error;
    }
  }

  /**
   * Check if two users are connected
   * @param {string} userA - First user ID
   * @param {string} userB - Second user ID
   * @returns {Promise<object|null>} Connection if exists, null otherwise
   */
  async areUsersConnected(userA, userB) {
    try {
      const connection = await Connection.findOne({
        $or: [
          { userA: userA, userB: userB },
          { userA: userB, userB: userA },
        ],
      });

      return connection
        ? {
            id: connection._id.toString(),
            status: normalizeConnectionStatus(connection.status),
            canMessage: connection.status === "accepted",
          }
        : null;
    } catch (error) {
      console.error("areUsersConnected error:", error);
      throw error;
    }
  }
}

// Export singleton instance
const connectionService = new ConnectionService();
export default connectionService;
