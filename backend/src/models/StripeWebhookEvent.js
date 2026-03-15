import mongoose from "mongoose";

const stripeWebhookEventSchema = new mongoose.Schema(
  {
    stripeEventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const StripeWebhookEvent =
  mongoose.models.StripeWebhookEvent ||
  mongoose.model("StripeWebhookEvent", stripeWebhookEventSchema);

export default StripeWebhookEvent;
