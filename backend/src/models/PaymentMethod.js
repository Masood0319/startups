import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema({
  // Owner of the payment method
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Stripe payment method ID
  stripePaymentMethodId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Stripe customer ID
  stripeCustomerId: {
    type: String,
    required: true,
    index: true
  },

  // Payment method type and details
  type: {
    type: String,
    required: true,
    enum: ['card', 'bank_account', 'wallet'],
    default: 'card'
  },

  // Card details (for display purposes only - never store sensitive data)
  card: {
    brand: {
      type: String,
      enum: ['visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', 'unionpay', 'unknown']
    },
    last4: {
      type: String,
      length: 4
    },
    expiryMonth: {
      type: Number,
      min: 1,
      max: 12
    },
    expiryYear: {
      type: Number,
      min: new Date().getFullYear()
    },
    country: String,
    funding: {
      type: String,
      enum: ['credit', 'debit', 'prepaid', 'unknown']
    }
  },

  // Bank account details (for display purposes only)
  bankAccount: {
    bankName: String,
    accountType: {
      type: String,
      enum: ['checking', 'savings', 'unknown']
    },
    last4: {
      type: String,
      length: 4
    },
    routingNumber: String,
    country: String
  },

  // Status and settings
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // Security and fraud prevention
  fingerprint: String, // Stripe fingerprint for duplicate detection

  // Usage tracking
  lastUsedAt: Date,
  usageCount: {
    type: Number,
    default: 0
  },

  // Billing address
  billingAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: {
      type: String,
      default: 'US'
    }
  },

  // Metadata
  nickname: {
    type: String,
    maxlength: 50,
    trim: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
paymentMethodSchema.index({ userId: 1, isDefault: 1 });
paymentMethodSchema.index({ userId: 1, isActive: 1 });
paymentMethodSchema.index({ stripeCustomerId: 1 });
paymentMethodSchema.index({ fingerprint: 1 }, { sparse: true });
paymentMethodSchema.index({ createdAt: -1 });

// Ensure only one default payment method per user
paymentMethodSchema.index(
  { userId: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true }
  }
);

// Virtual fields
paymentMethodSchema.virtual('displayName').get(function() {
  if (this.nickname) return this.nickname;

  if (this.type === 'card' && this.card) {
    const brand = this.card.brand ? this.card.brand.toUpperCase() : 'CARD';
    return `${brand} ****${this.card.last4}`;
  }

  if (this.type === 'bank_account' && this.bankAccount) {
    const bank = this.bankAccount.bankName || 'BANK';
    return `${bank} ****${this.bankAccount.last4}`;
  }

  return this.type.toUpperCase();
});

paymentMethodSchema.virtual('isExpired').get(function() {
  if (this.type !== 'card' || !this.card || !this.card.expiryMonth || !this.card.expiryYear) {
    return false;
  }

  const now = new Date();
  const expiry = new Date(this.card.expiryYear, this.card.expiryMonth - 1);
  return now > expiry;
});

paymentMethodSchema.virtual('isExpiringSoon').get(function() {
  if (this.type !== 'card' || !this.card || !this.card.expiryMonth || !this.card.expiryYear) {
    return false;
  }

  const now = new Date();
  const expiry = new Date(this.card.expiryYear, this.card.expiryMonth - 1);
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  return expiry <= threeMonthsFromNow && expiry > now;
});

// Instance methods
paymentMethodSchema.methods.markAsUsed = function() {
  this.lastUsedAt = new Date();
  this.usageCount += 1;
  return this.save();
};

paymentMethodSchema.methods.setAsDefault = async function() {
  // Remove default flag from other payment methods for this user
  await this.constructor.updateMany(
    { userId: this.userId, _id: { $ne: this._id } },
    { isDefault: false }
  );

  // Set this as default
  this.isDefault = true;
  return this.save();
};

paymentMethodSchema.methods.softDelete = function() {
  this.isActive = false;
  this.deletedAt = new Date();
  return this.save();
};

// Static methods
paymentMethodSchema.statics.findActiveByUser = function(userId) {
  return this.find({
    userId,
    isActive: true,
    deletedAt: { $exists: false }
  }).sort({ isDefault: -1, createdAt: -1 });
};

paymentMethodSchema.statics.findDefaultByUser = function(userId) {
  return this.findOne({
    userId,
    isDefault: true,
    isActive: true,
    deletedAt: { $exists: false }
  });
};

paymentMethodSchema.statics.findByStripeId = function(stripePaymentMethodId) {
  return this.findOne({
    stripePaymentMethodId,
    isActive: true,
    deletedAt: { $exists: false }
  });
};

paymentMethodSchema.statics.createFromStripe = async function(userId, stripePaymentMethod, stripeCustomerId, setAsDefault = false) {
  const paymentMethodData = {
    userId,
    stripePaymentMethodId: stripePaymentMethod.id,
    stripeCustomerId,
    type: stripePaymentMethod.type,
    isDefault: setAsDefault,
    fingerprint: stripePaymentMethod.card?.fingerprint || stripePaymentMethod.bank_account?.fingerprint
  };

  // Extract card details
  if (stripePaymentMethod.type === 'card' && stripePaymentMethod.card) {
    paymentMethodData.card = {
      brand: stripePaymentMethod.card.brand,
      last4: stripePaymentMethod.card.last4,
      expiryMonth: stripePaymentMethod.card.exp_month,
      expiryYear: stripePaymentMethod.card.exp_year,
      country: stripePaymentMethod.card.country,
      funding: stripePaymentMethod.card.funding
    };
  }

  // Extract bank account details
  if (stripePaymentMethod.type === 'us_bank_account' && stripePaymentMethod.us_bank_account) {
    paymentMethodData.type = 'bank_account';
    paymentMethodData.bankAccount = {
      bankName: stripePaymentMethod.us_bank_account.bank_name,
      accountType: stripePaymentMethod.us_bank_account.account_type,
      last4: stripePaymentMethod.us_bank_account.last4,
      routingNumber: stripePaymentMethod.us_bank_account.routing_number,
      country: 'US'
    };
  }

  // Extract billing address
  if (stripePaymentMethod.billing_details?.address) {
    paymentMethodData.billingAddress = {
      line1: stripePaymentMethod.billing_details.address.line1,
      line2: stripePaymentMethod.billing_details.address.line2,
      city: stripePaymentMethod.billing_details.address.city,
      state: stripePaymentMethod.billing_details.address.state,
      postalCode: stripePaymentMethod.billing_details.address.postal_code,
      country: stripePaymentMethod.billing_details.address.country || 'US'
    };
  }

  const paymentMethod = new this(paymentMethodData);

  // If setting as default, ensure no other default exists
  if (setAsDefault) {
    await this.updateMany(
      { userId, isDefault: true },
      { isDefault: false }
    );
  }

  return paymentMethod.save();
};

// Pre-save middleware
paymentMethodSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-remove middleware
paymentMethodSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  this.softDelete();
  next();
});

const PaymentMethod = mongoose.models.PaymentMethod || mongoose.model('PaymentMethod', paymentMethodSchema);

export default PaymentMethod;
