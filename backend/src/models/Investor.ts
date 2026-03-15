import mongoose, { Model, Schema, Types } from "mongoose";

export interface InvestorDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  industries: string[];
  ticketSizeMin: number;
  ticketSizeMax: number;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const investorSchema = new Schema<InvestorDocument>(
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

const Investor =
  (mongoose.models.Investor as Model<InvestorDocument>) ||
  mongoose.model<InvestorDocument>("Investor", investorSchema);

export default Investor;
