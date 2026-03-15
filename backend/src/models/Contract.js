import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
  {
    investmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investment",
      required: true,
      index: true,
    },
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
      enum: ["draft", "active", "signed", "canceled", "expired"],
      default: "draft",
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

contractSchema.index({ investorId: 1, startupId: 1, type: 1, createdAt: -1 });
contractSchema.index({ type: 1, status: 1, createdAt: -1 });

const Contract = mongoose.models.Contract || mongoose.model("Contract", contractSchema);

export default Contract;
