import mongoose from 'mongoose';

const startupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  tagline: {
    type: String,
    maxlength: 200
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Basic Information
  industry: {
    type: String,
    required: true
  },
  industries: [{
    type: String
  }],
  stage: {
    type: String,
    enum: ['idea', 'prototype', 'mvp', 'pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'growth'],
    default: 'idea'
  },
  foundedYear: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  },
  // Location
  geography: {
    type: String
  },
  location: {
    type: String
  },
  // Team
  teamSize: {
    type: Number,
    min: 1,
    default: 1
  },
  // Funding
  fundingTarget: {
    type: Number,
    min: 0
  },
  fundingRaised: {
    type: Number,
    min: 0,
    default: 0
  },
  valuation: {
    type: Number,
    min: 0
  },
  // Media
  logoFileName: {
    type: String
  },
  logoUrl: {
    type: String
  },
  pitchDeckFileName: {
    type: String
  },
  pitchDeckUrl: {
    type: String
  },
  images: [{
    fileName: String,
    url: String,
    caption: String
  }],
  // Web presence
  website: {
    type: String
  },
  linkedin: {
    type: String
  },
  twitter: {
    type: String
  },
  // Business model
  businessModel: {
    type: String,
    enum: ['B2B', 'B2C', 'B2B2C', 'marketplace', 'saas', 'other']
  },
  revenue: {
    type: Number,
    min: 0,
    default: 0
  },
  revenueModel: {
    type: String,
    enum: ['subscription', 'transaction', 'advertising', 'freemium', 'other']
  },
  // Traction
  customers: {
    type: Number,
    min: 0,
    default: 0
  },
  monthlyGrowthRate: {
    type: Number,
    min: 0
  },
  // Investment preferences (for matching)
  seekingInvestmentAmount: {
    type: Number,
    min: 0
  },
  investmentType: {
    type: String,
    enum: ['equity', 'debt', 'convertible', 'safe', 'revenue-sharing']
  },
  useOfFunds: {
    type: String,
    maxlength: 500
  },
  // Competitive advantage
  uniqueSellingProposition: {
    type: String,
    maxlength: 300
  },
  competitiveAdvantage: {
    type: String,
    maxlength: 500
  },
  // Market
  targetMarket: {
    type: String,
    maxlength: 300
  },
  marketSize: {
    type: String,
    maxlength: 200
  },
  // Status and visibility
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'connections-only'],
    default: 'public'
  },
  featured: {
    type: Boolean,
    default: false
  },
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  connectionCount: {
    type: Number,
    default: 0
  },
  lastViewedAt: {
    type: Date
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
startupSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for performance and search
startupSchema.index({ name: 1 });
startupSchema.index({ userId: 1 });
startupSchema.index({ industry: 1 });
startupSchema.index({ industries: 1 });
startupSchema.index({ stage: 1 });
startupSchema.index({ geography: 1 });
startupSchema.index({ status: 1, visibility: 1 });
startupSchema.index({ featured: 1, createdAt: -1 });
startupSchema.index({ viewCount: -1 });
startupSchema.index({ connectionCount: -1 });
startupSchema.index({ createdAt: -1 });

// Text index for search
startupSchema.index({
  name: 'text',
  description: 'text',
  tagline: 'text',
  industry: 'text'
});

// Virtual for funding progress
startupSchema.virtual('fundingProgress').get(function() {
  if (!this.fundingTarget || this.fundingTarget === 0) return 0;
  return Math.min((this.fundingRaised / this.fundingTarget) * 100, 100);
});

// Method to increment view count
startupSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  this.lastViewedAt = new Date();
  return this.save();
};

// Method to increment connection count
startupSchema.methods.incrementConnectionCount = function() {
  this.connectionCount += 1;
  return this.save();
};

// Static method to get trending startups
startupSchema.statics.getTrending = function(limit = 10, days = 7) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  return this.find({
    status: 'approved',
    visibility: { $in: ['public', 'connections-only'] },
    lastViewedAt: { $gte: dateThreshold }
  })
  .sort({ viewCount: -1, connectionCount: -1, createdAt: -1 })
  .limit(limit)
  .populate('userId', 'full_name avatar');
};

// Static method to search startups
startupSchema.statics.search = function(query, filters = {}) {
  const searchQuery = {
    status: 'approved',
    visibility: { $in: ['public', 'connections-only'] }
  };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  if (filters.industry && filters.industry.length > 0) {
    searchQuery.$or = [
      { industry: { $in: filters.industry } },
      { industries: { $in: filters.industry } }
    ];
  }

  if (filters.stage && filters.stage.length > 0) {
    searchQuery.stage = { $in: filters.stage };
  }

  if (filters.geography && filters.geography.length > 0) {
    searchQuery.geography = { $in: filters.geography };
  }

  if (filters.fundingMin || filters.fundingMax) {
    searchQuery.fundingTarget = {};
    if (filters.fundingMin) searchQuery.fundingTarget.$gte = filters.fundingMin;
    if (filters.fundingMax) searchQuery.fundingTarget.$lte = filters.fundingMax;
  }

  return this.find(searchQuery)
    .populate('userId', 'full_name avatar location')
    .sort(query ? { score: { $meta: 'textScore' } } : { createdAt: -1 });
};

// Method to check if user can view this startup
startupSchema.methods.canUserView = function(userId) {
  if (this.visibility === 'public') return true;
  if (this.visibility === 'private') return this.userId.toString() === userId?.toString();
  // For connections-only, you'd need to check if user has connection with founder
  return true; // Simplified for now
};

const Startup = mongoose.models.Startup || mongoose.model('Startup', startupSchema);

export default Startup;
