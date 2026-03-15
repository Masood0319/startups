import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  connectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Connection',
    required: true
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Connection',
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image'],
    default: 'text'
  },
  // File attachments
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    fileType: String
  }],
  // Message status
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  delivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  // Message threading
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  // Timestamps
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
messageSchema.pre('validate', function(next) {
  if (!this.threadId && this.connectionId) {
    this.threadId = this.connectionId;
  }
  next();
});

messageSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Set readAt when message is marked as read
  if (this.isModified('read') && this.read && !this.readAt) {
    this.readAt = new Date();
  }

  // Set deliveredAt when message is marked as delivered
  if (this.isModified('delivered') && this.delivered && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }

  next();
});

// Indexes for performance
messageSchema.index({ threadId: 1, createdAt: -1 });
messageSchema.index({ connectionId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });
messageSchema.index({ read: 1, receiverId: 1 });
messageSchema.index({ createdAt: -1 });

// Static method to get messages for a connection
messageSchema.statics.getConnectionMessages = function(connectionId, limit = 50, page = 1) {
  const skip = (page - 1) * limit;

  return this.find({ connectionId })
    .populate('senderId', 'full_name avatar')
    .populate('receiverId', 'full_name avatar')
    .populate('replyTo', 'content senderId createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get unread message count for a user
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    receiverId: userId,
    read: false
  });
};

// Static method to get last message in a connection
messageSchema.statics.getLastMessage = function(connectionId) {
  return this.findOne({ connectionId })
    .populate('senderId', 'full_name')
    .sort({ createdAt: -1 });
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = async function(connectionId, receiverId) {
  return this.updateMany(
    {
      connectionId,
      receiverId,
      read: false
    },
    {
      read: true,
      readAt: new Date(),
      updatedAt: new Date()
    }
  );
};

// Method to check if user can access this message
messageSchema.methods.canUserAccess = function(userId) {
  return this.senderId.toString() === userId.toString() ||
         this.receiverId.toString() === userId.toString();
};

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
