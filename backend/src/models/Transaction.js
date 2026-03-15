import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  // Core transaction data
  transactionId: {
    type: String,
    required: true,
    unique: true,
    default: () => `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  // Payment participants
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Amount and currency
  amount: {
    type: Number,
    required: true,
    min: [1, 'Amount must be at least 1 cent'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value); // Stored in cents
      },
      message: 'Amount must be stored as integer cents'
    }
  },
  currency: {
    type: String,
    required: true,
    default: 'usd',
    uppercase: true,
    enum: ['USD', 'EUR', 'GBP']
  },

  // Transaction status
  status: {
    type: String,
    required: true,
    default: 'pending',
    enum: [
      'pending',        // Payment initiated but not confirmed
      'processing',     // Being processed by payment gateway
      'succeeded',      // Payment completed successfully
      'failed',         // Payment failed
      'canceled',       // Canceled before processing
      'refunded',       // Payment was refunded
      'disputed'        // Payment is under dispute
    ],
    index: true
  },

  // Gateway integration
  stripePaymentIntentId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  stripeChargeId: {
    type: String,
    sparse: true
  },
  gatewayTransactionId: {
    type: String,
    sparse: true
  },

  // Transaction metadata
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  internalNote: {
    type: String,
    maxlength: 1000,
    trim: true
  },

  // Related entities
  connectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Connection',
    sparse: true
  },
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    sparse: true
  },

  // Payment method info (stored after successful payment)
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'bank_transfer', 'bank_account', 'wallet']
    },
    brand: String,  // visa, mastercard, etc.
    last4: String,
    country: String
  },

  // Failure information
  failureCode: String,
  failureMessage: String,
  failureDeclineCode: String,

  // Refund information
  refundAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  refundReason: String,
  refundedAt: Date,
  refundTransactionId: String,

  // Security and fraud prevention
  clientIp: String,
  userAgent: String,
  fraudScore: {
    type: Number,
    min: 0,
    max: 100
  },

  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: Date,
  completedAt: Date,
  failedAt: Date,

  // Audit trail
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded', 'disputed']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    reason: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Notification tracking
  notificationsSent: {
    senderNotified: {
      type: Boolean,
      default: false
    },
    receiverNotified: {
      type: Boolean,
      default: false
    },
    adminNotified: {
      type: Boolean,
      default: false
    }
  },

  // Metadata for additional context
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
transactionSchema.index({ senderId: 1, createdAt: -1 });
transactionSchema.index({ receiverId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });
transactionSchema.index({ transactionId: 1 }, { unique: true });
transactionSchema.index({ connectionId: 1 }, { sparse: true });
transactionSchema.index({ startupId: 1 }, { sparse: true });

// Compound indexes for queries
transactionSchema.index({ senderId: 1, status: 1 });
transactionSchema.index({ receiverId: 1, status: 1 });
transactionSchema.index({ senderId: 1, receiverId: 1 });

// Virtual fields
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency.toLowerCase()
  }).format(this.amount / 100);
});

transactionSchema.virtual('netAmount').get(function() {
  return this.amount - (this.refundAmount || 0);
});

transactionSchema.virtual('isRefundable').get(function() {
  return this.status === 'succeeded' && this.refundAmount < this.amount;
});

transactionSchema.virtual('sender', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true
});

transactionSchema.virtual('receiver', {
  ref: 'User',
  localField: 'receiverId',
  foreignField: '_id',
  justOne: true
});

// Instance methods
transactionSchema.methods.addStatusUpdate = function(newStatus, reason, updatedBy) {
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    reason,
    updatedBy
  });
  this.status = newStatus;

  // Update relevant timestamps
  switch (newStatus) {
    case 'processing':
      this.processedAt = new Date();
      break;
    case 'succeeded':
      this.completedAt = new Date();
      break;
    case 'failed':
      this.failedAt = new Date();
      break;
  }
};

transactionSchema.methods.canBeRefunded = function() {
  return this.status === 'succeeded' &&
         this.refundAmount < this.amount &&
         this.completedAt &&
         (Date.now() - this.completedAt.getTime()) < (90 * 24 * 60 * 60 * 1000); // 90 days
};

transactionSchema.methods.calculateRefundAmount = function(requestedAmount) {
  if (!requestedAmount) return this.amount - this.refundAmount;

  const maxRefundable = this.amount - this.refundAmount;
  return Math.min(requestedAmount, maxRefundable);
};

// Static methods
transactionSchema.statics.getTransactionsByUser = function(userId, options = {}) {
  const { status, limit = 20, skip = 0, dateFrom, dateTo } = options;

  const query = {
    $or: [
      { senderId: userId },
      { receiverId: userId }
    ]
  };

  if (status) {
    query.status = status;
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  return this.find(query)
    .populate('senderId', 'full_name email avatar role')
    .populate('receiverId', 'full_name email avatar role')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

transactionSchema.statics.getTransactionStats = function(userId, dateFrom, dateTo) {
  const matchStage = {
    $or: [
      { senderId: userId },
      { receiverId: userId }
    ]
  };

  if (dateFrom || dateTo) {
    matchStage.createdAt = {};
    if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
    if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSent: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$senderId', userId] }, { $eq: ['$status', 'succeeded'] }] },
              '$amount',
              0
            ]
          }
        },
        totalReceived: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$status', 'succeeded'] }] },
              '$amount',
              0
            ]
          }
        },
        totalTransactions: { $sum: 1 },
        successfulTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'succeeded'] }, 1, 0] }
        },
        failedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Validate sender and receiver are different
  if (this.senderId && this.receiverId && this.senderId.toString() === this.receiverId.toString()) {
    return next(new Error('Sender and receiver cannot be the same'));
  }

  next();
});

// Post-save middleware for notifications
transactionSchema.post('save', async function(doc) {
  // Auto-populate for middleware
  await doc.populate('senderId receiverId');

  // This would typically trigger notification creation
  // Implementation would depend on your notification service
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

export default Transaction;
