import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  userA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participantKey: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    // Keep `declined` temporarily for backward compatibility with legacy rows.
    enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'declined'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: 500
  },
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    default: null
  },
  roundType: {
    type: String,
    enum: ['seed', 'pre-seed', 'series-a', 'series-b', 'series-c', 'bridge', 'growth'],
    default: null
  },
  shortPitch: {
    type: String,
    maxlength: 200
  },
  // Connection metadata
  respondedAt: {
    type: Date,
    default: null
  },
  lastInteractionAt: {
    type: Date,
    default: Date.now
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
connectionSchema.pre('validate', function(next) {
  if (this.userA && this.userB) {
    const a = this.userA.toString();
    const b = this.userB.toString();
    this.participantKey = a < b ? `${a}:${b}` : `${b}:${a}`;
  }
  next();
});

connectionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.isModified('status') && this.status !== 'pending') {
    this.respondedAt = new Date();
  }
  next();
});

// Compound indexes for efficient queries
connectionSchema.index({ participantKey: 1 }, { unique: true });
connectionSchema.index({ userA: 1, userB: 1 });
connectionSchema.index({ userA: 1, status: 1 });
connectionSchema.index({ userB: 1, status: 1 });
connectionSchema.index({ initiatedBy: 1 });
connectionSchema.index({ createdAt: -1 });
connectionSchema.index({ lastInteractionAt: -1 });

// Virtual for getting the other user in the connection
connectionSchema.virtual('otherUser').get(function() {
  return this.userA.toString() === this.currentUserId ? this.userB : this.userA;
});

// Method to check if user is part of this connection
connectionSchema.methods.isUserInConnection = function(userId) {
  return this.userA.toString() === userId.toString() ||
         this.userB.toString() === userId.toString();
};

// Method to get connection partner
connectionSchema.methods.getPartner = function(userId) {
  if (this.userA.toString() === userId.toString()) {
    return this.userB;
  } else if (this.userB.toString() === userId.toString()) {
    return this.userA;
  }
  return null;
};

// Static method to find connections for a user
connectionSchema.statics.findUserConnections = function(userId, status = null) {
  const query = {
    $or: [
      { userA: userId },
      { userB: userId }
    ]
  };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate('userA', 'full_name email role avatar')
    .populate('userB', 'full_name email role avatar')
    .populate('startupId', 'name description industry')
    .sort({ lastInteractionAt: -1 });
};

// Static method to check if connection exists between two users
connectionSchema.statics.connectionExists = async function(userA, userB) {
  const a = userA.toString();
  const b = userB.toString();
  const participantKey = a < b ? `${a}:${b}` : `${b}:${a}`;
  const connection = await this.findOne({ participantKey });
  return !!connection;
};

const Connection = mongoose.models.Connection || mongoose.model('Connection', connectionSchema);

export default Connection;
