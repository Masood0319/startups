import mongoose, { Schema } from "mongoose";

const founderSchema = new Schema(
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

const Founder = mongoose.models.Founder || mongoose.model("Founder", founderSchema);

export default Founder;
