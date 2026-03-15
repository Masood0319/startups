import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    type: {
      type: String,
      required: true,
      enum: ["equity", "profit-sharing", "safe", "revenue-sharing", "crowdfunding"],
      index: true,
    },
    terms: { type: mongoose.Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "declined", "completed", "canceled"],
      default: "pending",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

investmentSchema.index({ investorId: 1, startupId: 1, type: 1, createdAt: -1 });
investmentSchema.index({ type: 1, status: 1, createdAt: -1 });

const Investment =
  mongoose.models.Investment || mongoose.model("Investment", investmentSchema);

export default Investment;
