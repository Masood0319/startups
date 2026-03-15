import mongoose, { Schema } from "mongoose";

const investorSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    industries: {
      type: [String],
      default: [],
    },
    ticketSizeMin: {
      type: Number,
      default: 0,
      min: 0,
    },
    ticketSizeMax: {
      type: Number,
      default: 0,
      min: 0,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

investorSchema.index({ userId: 1 }, { unique: true });

const Investor = mongoose.models.Investor || mongoose.model("Investor", investorSchema);

export default Investor;
