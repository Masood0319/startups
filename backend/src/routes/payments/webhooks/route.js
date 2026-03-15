import { headers } from "#root/shims/nextHeaders.js";
import connectDB from "#root/lib/mongoose.js";
import Transaction from "#root/models/Transaction.js";
import StripeWebhookEvent from "#root/models/StripeWebhookEvent.js";
import PaymentService from "#root/services/paymentService.js";
import { StripeService } from "#root/lib/stripe.js";
import { success, error as errorResponse } from "#root/lib/response.js";

export const runtime = "nodejs";

async function registerWebhookEvent(event) {
  try {
    await StripeWebhookEvent.create({
      stripeEventId: event.id,
      type: event.type,
      processedAt: new Date(),
    });
    return { duplicate: false };
  } catch (error) {
    if (error?.code === 11000) {
      return { duplicate: true };
    }
    throw error;
  }
}

export async function POST(request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("Stripe webhook: missing signature");
      return errorResponse("No signature found", 400);
    }

    let event;
    try {
      event = StripeService.constructWebhookEvent(body, signature);
    } catch (error) {
      console.error("Stripe webhook signature verification failed:", error.message);
      return errorResponse("Webhook signature verification failed", 400);
    }

    await connectDB();

    const idempotency = await registerWebhookEvent(event);
    if (idempotency.duplicate) {
      console.log(`Stripe webhook duplicate ignored: ${event.id}`);
      return success({ received: true, duplicate: true });
    }

    console.log(`Processing Stripe webhook event: ${event.type} (${event.id})`);

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;
      case "payment_intent.canceled":
        await handlePaymentIntentCanceled(event.data.object);
        break;
      case "payment_intent.requires_action":
        await handlePaymentIntentRequiresAction(event.data.object);
        break;
      case "charge.succeeded":
        await handleChargeSucceeded(event.data.object);
        break;
      case "charge.failed":
        await handleChargeFailed(event.data.object);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;
      case "payment_method.attached":
      case "customer.created":
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
        console.log(`Stripe webhook event skipped by design: ${event.type}`);
        break;
      default:
        console.log(`Stripe webhook unhandled event type: ${event.type}`);
    }

    return success({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);
    return errorResponse("Webhook processing failed", 500);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntent.id,
    }).populate(["senderId", "receiverId"]);

    if (!transaction) {
      console.error("Stripe webhook: transaction not found for payment_intent.succeeded", paymentIntent.id);
      return;
    }

    if (transaction.status === "succeeded") {
      return;
    }

    transaction.addStatusUpdate("succeeded", "Payment confirmed by Stripe webhook", null);
    transaction.stripeChargeId =
      paymentIntent.latest_charge?.id || paymentIntent.latest_charge || paymentIntent.charges?.data?.[0]?.id;
    transaction.gatewayTransactionId = paymentIntent.id;
    transaction.completedAt = new Date();

    if (paymentIntent.payment_method) {
      const paymentMethodId =
        typeof paymentIntent.payment_method === "string"
          ? paymentIntent.payment_method
          : paymentIntent.payment_method.id;

      try {
        const stripe = StripeService.getClient();
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

        if (paymentMethod.card) {
          transaction.paymentMethod = {
            type: "card",
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            country: paymentMethod.card.country,
          };
        } else if (paymentMethod.us_bank_account) {
          transaction.paymentMethod = {
            type: "bank_account",
            brand: paymentMethod.us_bank_account.bank_name,
            last4: paymentMethod.us_bank_account.last4,
            country: "US",
          };
        }
      } catch (error) {
        console.error("Stripe webhook: failed to enrich payment method", error);
      }
    }

    await transaction.save();
    await PaymentService.sendTransactionNotifications(transaction, "succeeded");
  } catch (error) {
    console.error("Stripe webhook handlePaymentIntentSucceeded error:", error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntent.id,
    }).populate(["senderId", "receiverId"]);

    if (!transaction) {
      console.error("Stripe webhook: transaction not found for payment_intent.payment_failed", paymentIntent.id);
      return;
    }

    if (transaction.status === "failed") {
      return;
    }

    transaction.addStatusUpdate("failed", "Payment failed via Stripe webhook", null);
    transaction.failureCode = paymentIntent.last_payment_error?.code;
    transaction.failureMessage = paymentIntent.last_payment_error?.message;
    transaction.failureDeclineCode = paymentIntent.last_payment_error?.decline_code;
    transaction.failedAt = new Date();

    await transaction.save();
    await PaymentService.sendTransactionNotifications(transaction, "failed");
  } catch (error) {
    console.error("Stripe webhook handlePaymentIntentFailed error:", error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent) {
  try {
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntent.id,
    }).populate(["senderId", "receiverId"]);

    if (!transaction) {
      console.error("Stripe webhook: transaction not found for payment_intent.canceled", paymentIntent.id);
      return;
    }

    if (transaction.status === "canceled") {
      return;
    }

    transaction.addStatusUpdate("canceled", "Payment canceled via Stripe webhook", null);
    await transaction.save();
    await PaymentService.sendTransactionNotifications(transaction, "canceled");
  } catch (error) {
    console.error("Stripe webhook handlePaymentIntentCanceled error:", error);
  }
}

async function handlePaymentIntentRequiresAction(paymentIntent) {
  try {
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (!transaction) {
      console.error("Stripe webhook: transaction not found for payment_intent.requires_action", paymentIntent.id);
      return;
    }

    transaction.addStatusUpdate("processing", "Payment requires additional authentication", null);
    transaction.processedAt = new Date();
    await transaction.save();
  } catch (error) {
    console.error("Stripe webhook handlePaymentIntentRequiresAction error:", error);
  }
}

async function handleChargeSucceeded(charge) {
  try {
    const transaction = await Transaction.findOne({ stripeChargeId: charge.id });

    if (!transaction) {
      const byPaymentIntent = await Transaction.findOne({
        stripePaymentIntentId: charge.payment_intent,
      });
      if (byPaymentIntent && !byPaymentIntent.stripeChargeId) {
        byPaymentIntent.stripeChargeId = charge.id;
        await byPaymentIntent.save();
      }
      return;
    }

    if (charge.billing_details) {
      const existingMetadata =
        transaction.metadata instanceof Map
          ? Object.fromEntries(transaction.metadata)
          : transaction.metadata || {};
      transaction.metadata = {
        ...existingMetadata,
        billingEmail: charge.billing_details.email,
        billingName: charge.billing_details.name,
      };
    }

    if (charge.payment_method_details?.card) {
      const details = charge.payment_method_details.card;
      transaction.paymentMethod = {
        type: "card",
        brand: details.brand,
        last4: details.last4,
        country: details.country,
      };
    }

    if (charge.outcome) {
      transaction.fraudScore = charge.outcome.risk_score;
    }

    await transaction.save();
  } catch (error) {
    console.error("Stripe webhook handleChargeSucceeded error:", error);
  }
}

async function handleChargeFailed(charge) {
  try {
    const transaction = await Transaction.findOne({
      $or: [{ stripeChargeId: charge.id }, { stripePaymentIntentId: charge.payment_intent }],
    });

    if (!transaction) {
      console.error("Stripe webhook: transaction not found for charge.failed", charge.id);
      return;
    }

    if (charge.failure_code || charge.failure_message) {
      transaction.failureCode = charge.failure_code;
      transaction.failureMessage = charge.failure_message;
      transaction.failureDeclineCode = charge.outcome?.reason;
      await transaction.save();
    }
  } catch (error) {
    console.error("Stripe webhook handleChargeFailed error:", error);
  }
}

async function handleChargeRefunded(charge) {
  try {
    const transaction = await Transaction.findOne({ stripeChargeId: charge.id }).populate([
      "senderId",
      "receiverId",
    ]);

    if (!transaction) {
      console.error("Stripe webhook: transaction not found for charge.refunded", charge.id);
      return;
    }

    const totalRefunded = (charge.refunds?.data || []).reduce((sum, refund) => sum + refund.amount, 0);

    transaction.refundAmount = totalRefunded;
    transaction.refundedAt = new Date();

    if ((charge.refunds?.data || []).length > 0) {
      const latestRefund = charge.refunds.data[0];
      transaction.refundReason = latestRefund.reason || "requested_by_customer";
      transaction.refundTransactionId = latestRefund.id;
    }

    if (totalRefunded >= transaction.amount) {
      transaction.addStatusUpdate("refunded", "Fully refunded via Stripe webhook", null);
    } else {
      transaction.addStatusUpdate("succeeded", "Partially refunded via Stripe webhook", null);
    }

    await transaction.save();
    await PaymentService.sendTransactionNotifications(transaction, "refunded");
  } catch (error) {
    console.error("Stripe webhook handleChargeRefunded error:", error);
  }
}
