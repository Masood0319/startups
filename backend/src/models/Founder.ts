import mongoose, { Model, Schema, Types } from "mongoose";

export interface FounderDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  experience?: string;
  linkedin?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const founderSchema = new Schema<FounderDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    experience: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    linkedin: {
      type: String,
      trim: true,
      maxlength: 300,
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

founderSchema.index({ userId: 1 }, { unique: true });

const Founder =
  (mongoose.models.Founder as Model<FounderDocument>) ||
  mongoose.model<FounderDocument>("Founder", founderSchema);

export default Founder;
