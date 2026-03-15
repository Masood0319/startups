import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  full_name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ["founder", "investor", "fund_manager", "startup"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending_verification", "verified", "suspended"],
    default: "pending_verification",
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  avatar: {
    type: String,
  },
  location: {
    type: String,
  },
  website: {
    type: String,
  },
  linkedin: {
    type: String,
  },
  twitter: {
    type: String,
  },
  industries: [
    {
      type: String,
    },
  ],
  // Email verification
  otp: {
    type: String,
  },
  otpExpiry: {
    type: Date,
  },
  // Password reset
  resetToken: {
    type: String,
  },
  resetTokenExpiry: {
    type: Date,
  },
  // Timestamps
  lastLoginAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
