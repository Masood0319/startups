import mongoose from "mongoose";

const fundSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, maxlength: 5000 },
    thesis: { type: String, maxlength: 3000 },
    website: { type: String, maxlength: 300 },
    managerEmail: { type: String, lowercase: true, trim: true },
    ownerEmail: { type: String, lowercase: true, trim: true },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdByEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    logo: { type: String },
  },
  { timestamps: true },
);

fundSchema.index({ createdById: 1, createdAt: -1 });
fundSchema.index({ createdByEmail: 1, createdAt: -1 });

const Fund = mongoose.models.Fund || mongoose.model("Fund", fundSchema);
export default Fund;
