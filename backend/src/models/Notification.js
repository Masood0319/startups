import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'connection_request',
      'connection_accepted',
      'connection_declined',
      'message',
      'system',
      'investment_interest',
      'profile_view',
      'payment_sent',
      'payment_received',
      'payment_failed',
      'payment_canceled',
      'payment_refunded'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // References to related objects
  relatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  relatedConnectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Connection',
    default: null
  },
  relatedMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  relatedStartupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    default: null
  },
  // Notification state
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  archived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date,
    default: null
  },
  // Priority and action
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String,
    default: null
  },
  // Timestamps
  expiresAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Set readAt when notification is marked as read
  if (this.isModified('read') && this.read && !this.readAt) {
    this.readAt = new Date();
  }

  // Set archivedAt when notification is archived
  if (this.isModified('archived') && this.archived && !this.archivedAt) {
    this.archivedAt = new Date();
  }

  next();
});

// Indexes for performance
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ expiresAt: 1 });

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    userId,
    read: false,
    archived: false,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });
};

// Static method to get notifications for a user
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const {
    limit = 50,
    page = 1,
    unreadOnly = false,
    type = null,
    includeArchived = false
  } = options;

  const skip = (page - 1) * limit;
  const query = {
    userId,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  };

  if (!includeArchived) {
    query.archived = false;
  }

  if (unreadOnly) {
    query.read = false;
  }

  if (type) {
    query.type = type;
  }

  return this.find(query)
    .populate('relatedUserId', 'full_name avatar role')
    .populate('relatedConnectionId')
    .populate('relatedStartupId', 'name description')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(userId, notificationIds = null) {
  const query = { userId, read: false };

  if (notificationIds && Array.isArray(notificationIds)) {
    query._id = { $in: notificationIds };
  }

  return this.updateMany(query, {
    read: true,
    readAt: new Date(),
    updatedAt: new Date()
  });
};

// Static method to create a notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();

  // You can add real-time notification logic here
  // e.g., emit to socket.io, send push notification, etc.

  return notification;
};

// Helper method to create connection request notification
notificationSchema.statics.createConnectionRequest = function(recipientId, senderId, connectionId) {
  return this.createNotification({
    userId: recipientId,
    type: 'connection_request',
    title: 'New Connection Request',
    message: 'You have a new connection request',
    relatedUserId: senderId,
    relatedConnectionId: connectionId,
    actionRequired: true,
    actionUrl: `/connections`,
    priority: 'normal'
  });
};

// Helper method to create connection accepted notification
notificationSchema.statics.createConnectionAccepted = function(recipientId, acceptedById, connectionId) {
  return this.createNotification({
    userId: recipientId,
    type: 'connection_accepted',
    title: 'Connection Accepted',
    message: 'Your connection request has been accepted',
    relatedUserId: acceptedById,
    relatedConnectionId: connectionId,
    actionRequired: false,
    actionUrl: `/messaging/${connectionId}`,
    priority: 'normal'
  });
};

// Helper method to create message notification
notificationSchema.statics.createMessage = function(recipientId, senderId, messageId, connectionId) {
  return this.createNotification({
    userId: recipientId,
    type: 'message',
    title: 'New Message',
    message: 'You have a new message',
    relatedUserId: senderId,
    relatedMessageId: messageId,
    relatedConnectionId: connectionId,
    actionRequired: false,
    actionUrl: `/messaging/${connectionId}`,
    priority: 'normal'
  });
};

// Method to check if notification belongs to user
notificationSchema.methods.belongsToUser = function(userId) {
  return this.userId.toString() === userId.toString();
};

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
