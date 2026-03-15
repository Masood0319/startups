import mongoose from "mongoose";
import connectDB from "#root/lib/mongoose.js";
import Transaction from "#root/models/Transaction.js";
import User from "#root/models/User.js";
import { StripeService } from "#root/lib/stripe.js";
import notificationService from "./notificationService.js";
import { assertValidCents, toCents, formatCents } from "#root/lib/payments/money.js";

class PaymentService {
  static async findTransactionByAnyId(identifier) {
    if (!identifier) return null;

    const clauses = [{ transactionId: identifier }, { stripePaymentIntentId: identifier }];
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      clauses.push({ _id: identifier });
    }

    return Transaction.findOne({ $or: clauses });
  }

  static assertOwnedBySender(transaction, userId, action) {
    if (!transaction?.senderId || transaction.senderId.toString() !== userId.toString()) {
      throw new Error(`Only the sender can ${action}`);
    }
  }

  static async createTransaction(senderId, receiverId, amount, description, metadata = {}) {
    try {
      await connectDB();

      if (!mongoose.Types.ObjectId.isValid(senderId)) {
        throw new Error("Invalid sender ID");
      }
      if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        throw new Error("Invalid receiver ID");
      }
      if (senderId.toString() === receiverId.toString()) {
        throw new Error("Cannot send payment to yourself");
      }

      const amountCents = assertValidCents(toCents(amount));

      const [sender, receiver] = await Promise.all([
        User.findById(senderId),
        User.findById(receiverId),
      ]);

      if (!sender) throw new Error("Sender not found");
      if (!receiver) throw new Error("Receiver not found");
      if (sender.status !== "verified") {
        throw new Error("Sender account must be verified to send payments");
      }
      if (receiver.status !== "verified") {
        throw new Error("Receiver account must be verified to receive payments");
      }
      if (sender.role === "founder" && receiver.role === "founder") {
        throw new Error("Founder to founder payments are not allowed");
      }

      const stripeCustomer = await StripeService.createOrRetrieveCustomer(sender);

      const paymentIntent = await StripeService.createPaymentIntent({
        amountCents,
        senderId,
        receiverId,
        description: description || `Payment from ${sender.full_name} to ${receiver.full_name}`,
        metadata: {
          ...metadata,
          senderRole: sender.role,
          receiverRole: receiver.role,
        },
      });

      const transaction = new Transaction({
        senderId,
        receiverId,
        amount: amountCents,
        currency: "USD",
        status: "pending",
        description: description || `Payment to ${receiver.full_name}`,
        internalNote: `Payment intent created: ${paymentIntent.id}`,
        stripePaymentIntentId: paymentIntent.id,
        connectionId: metadata.connectionId,
        startupId: metadata.startupId,
        metadata: {
          ...metadata,
          stripeCustomerId: stripeCustomer.id,
          paymentIntentStatus: paymentIntent.status,
        },
      });

      transaction.addStatusUpdate("pending", "Payment initiated", senderId);
      await transaction.save();
      await transaction.populate(["senderId", "receiverId"]);

      return {
        transaction,
        clientSecret: paymentIntent.client_secret,
        stripeCustomerId: stripeCustomer.id,
      };
    } catch (error) {
      console.error("PaymentService.createTransaction error:", error);
      throw error;
    }
  }

  static async confirmTransaction(transactionIdentifier, paymentIntentId) {
    try {
      await connectDB();

      const lookupId = transactionIdentifier || paymentIntentId;
      const transaction = await this.findTransactionByAnyId(lookupId);
      if (!transaction) {
        throw new Error("Transaction not found");
      }

      if (transaction.status !== "pending" && transaction.status !== "processing") {
        throw new Error("Transaction is not in confirmable status");
      }

      const targetPaymentIntentId = paymentIntentId || transaction.stripePaymentIntentId;
      if (!targetPaymentIntentId) {
        throw new Error("Missing Stripe payment intent ID");
      }

      if (
        transaction.stripePaymentIntentId &&
        transaction.stripePaymentIntentId !== targetPaymentIntentId
      ) {
        throw new Error("Payment intent does not belong to this transaction");
      }

      const paymentIntent = await StripeService.retrievePaymentIntent(targetPaymentIntentId);

      if (paymentIntent.status === "succeeded") {
        transaction.addStatusUpdate("succeeded", "Payment confirmed by Stripe", null);
        transaction.stripeChargeId =
          paymentIntent.latest_charge?.id || paymentIntent.latest_charge || paymentIntent.charges?.data?.[0]?.id;
        transaction.gatewayTransactionId = paymentIntent.id;
        transaction.completedAt = new Date();

        if (paymentIntent.payment_method?.card) {
          transaction.paymentMethod = {
            type: "card",
            brand: paymentIntent.payment_method.card.brand,
            last4: paymentIntent.payment_method.card.last4,
            country: paymentIntent.payment_method.card.country,
          };
        }

        await transaction.save();
        await transaction.populate(["senderId", "receiverId"]);
        await this.sendTransactionNotifications(transaction, "succeeded");
        return transaction;
      }

      if (paymentIntent.status === "requires_action" || paymentIntent.status === "processing") {
        transaction.addStatusUpdate("processing", `Payment status: ${paymentIntent.status}`, null);
        await transaction.save();
        return transaction;
      }

      transaction.addStatusUpdate("failed", `Payment failed: ${paymentIntent.status}`, null);
      transaction.failureCode = paymentIntent.last_payment_error?.code;
      transaction.failureMessage = paymentIntent.last_payment_error?.message;
      transaction.failureDeclineCode = paymentIntent.last_payment_error?.decline_code;
      transaction.failedAt = new Date();
      await transaction.save();
      await transaction.populate(["senderId", "receiverId"]);
      await this.sendTransactionNotifications(transaction, "failed");

      throw new Error(
        `Payment failed: ${paymentIntent.last_payment_error?.message || paymentIntent.status}`,
      );
    } catch (error) {
      console.error("PaymentService.confirmTransaction error:", error);
      throw error;
    }
  }

  static async cancelTransaction(transactionId, userId) {
    try {
      await connectDB();

      const transaction = await this.findTransactionByAnyId(transactionId).populate([
        "senderId",
        "receiverId",
      ]);
      if (!transaction) {
        throw new Error("Transaction not found");
      }

      this.assertOwnedBySender(transaction, userId, "cancel this transaction");

      if (transaction.status !== "pending" && transaction.status !== "processing") {
        throw new Error("Only pending or processing transactions can be canceled");
      }

      if (transaction.stripePaymentIntentId) {
        await StripeService.cancelPaymentIntent(transaction.stripePaymentIntentId);
      }

      transaction.addStatusUpdate("canceled", "Canceled by sender", userId);
      await transaction.save();
      await this.sendTransactionNotifications(transaction, "canceled");

      return transaction;
    } catch (error) {
      console.error("PaymentService.cancelTransaction error:", error);
      throw error;
    }
  }

  static async refundTransaction(transactionId, refundAmount, reason, requestedBy) {
    try {
      await connectDB();

      const transaction = await this.findTransactionByAnyId(transactionId).populate([
        "senderId",
        "receiverId",
      ]);
      if (!transaction) {
        throw new Error("Transaction not found");
      }

      this.assertOwnedBySender(transaction, requestedBy, "refund this transaction");

      if (transaction.status !== "succeeded") {
        throw new Error("Only successful transactions can be refunded");
      }
      if (!transaction.canBeRefunded()) {
        throw new Error("Transaction is not eligible for refund");
      }

      const refundAmountCents = refundAmount
        ? assertValidCents(toCents(refundAmount))
        : transaction.calculateRefundAmount();

      if (refundAmountCents > transaction.amount - transaction.refundAmount) {
        throw new Error("Refund amount exceeds available balance");
      }

      if (!transaction.stripeChargeId) {
        throw new Error("Stripe charge is missing for refund");
      }

      const refund = await StripeService.createRefund(
        transaction.stripeChargeId,
        refundAmountCents,
        reason || "requested_by_customer",
      );

      transaction.refundAmount += refundAmountCents;
      transaction.refundReason = reason || "Customer request";
      transaction.refundedAt = new Date();
      transaction.refundTransactionId = refund.id;

      if (transaction.refundAmount >= transaction.amount) {
        transaction.addStatusUpdate("refunded", "Fully refunded", requestedBy);
      } else {
        transaction.addStatusUpdate(
          "succeeded",
          `Partial refund of ${formatCents(refundAmountCents, transaction.currency)}`,
          requestedBy,
        );
      }

      await transaction.save();
      await this.sendTransactionNotifications(transaction, "refunded");

      return transaction;
    } catch (error) {
      console.error("PaymentService.refundTransaction error:", error);
      throw error;
    }
  }

  static async getTransactionById(transactionId, userId) {
    try {
      await connectDB();

      const transaction = await this.findTransactionByAnyId(transactionId).populate([
        "senderId",
        "receiverId",
        "connectionId",
        "startupId",
      ]);

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      const isParticipant =
        transaction.senderId._id.toString() === userId.toString() ||
        transaction.receiverId._id.toString() === userId.toString();
      if (!isParticipant) {
        throw new Error("Not authorized to view this transaction");
      }

      return transaction;
    } catch (error) {
      console.error("PaymentService.getTransactionById error:", error);
      throw error;
    }
  }

  static async getTransactionsByUser(userId, options = {}) {
    try {
      await connectDB();

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const { status, type, limit = 20, skip = 0, dateFrom, dateTo } = options;

      let query = {};
      if (type === "sent") {
        query.senderId = userId;
      } else if (type === "received") {
        query.receiverId = userId;
      } else {
        query = { $or: [{ senderId: userId }, { receiverId: userId }] };
      }

      if (status) query.status = status;
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      const [transactions, totalCount] = await Promise.all([
        Transaction.find(query)
          .populate("senderId", "full_name email avatar role")
          .populate("receiverId", "full_name email avatar role")
          .populate("connectionId")
          .populate("startupId", "company_name logo")
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip),
        Transaction.countDocuments(query),
      ]);

      return {
        transactions,
        totalCount,
        hasMore: skip + transactions.length < totalCount,
      };
    } catch (error) {
      console.error("PaymentService.getTransactionsByUser error:", error);
      throw error;
    }
  }

  static async getTransactionStats(userId, dateFrom, dateTo) {
    try {
      await connectDB();

      const stats = await Transaction.getTransactionStats(
        new mongoose.Types.ObjectId(userId),
        dateFrom,
        dateTo,
      );

      return (
        stats[0] || {
          totalSent: 0,
          totalReceived: 0,
          totalTransactions: 0,
          successfulTransactions: 0,
          failedTransactions: 0,
        }
      );
    } catch (error) {
      console.error("PaymentService.getTransactionStats error:", error);
      throw error;
    }
  }

  static async sendTransactionNotifications(transaction, eventType) {
    try {
      const senderId = transaction.senderId?._id || transaction.senderId;
      const receiverId = transaction.receiverId?._id || transaction.receiverId;
      const senderName = transaction.senderId?.full_name || "Sender";
      const receiverName = transaction.receiverId?.full_name || "Receiver";
      const formattedAmount = formatCents(transaction.amount, transaction.currency);

      if (eventType === "succeeded") {
        await notificationService.createNotification(senderId, "payment_sent", transaction.transactionId, {
          title: "Payment Sent Successfully",
          message: `Your payment of ${formattedAmount} to ${receiverName} was successful.`,
          actionUrl: `/dashboard/payments/${transaction.transactionId}`,
          data: { transactionId: transaction.transactionId, amount: transaction.amount, receiverName },
        });
        await notificationService.createNotification(receiverId, "payment_received", transaction.transactionId, {
          title: "Payment Received",
          message: `You received a payment of ${formattedAmount} from ${senderName}.`,
          actionUrl: `/dashboard/payments/${transaction.transactionId}`,
          data: { transactionId: transaction.transactionId, amount: transaction.amount, senderName },
        });
      }

      if (eventType === "failed") {
        await notificationService.createNotification(senderId, "payment_failed", transaction.transactionId, {
          title: "Payment Failed",
          message: `Your payment of ${formattedAmount} to ${receiverName} failed.`,
          actionUrl: `/dashboard/payments/${transaction.transactionId}`,
          data: { transactionId: transaction.transactionId, amount: transaction.amount },
        });
      }

      if (eventType === "canceled") {
        await notificationService.createNotification(receiverId, "payment_canceled", transaction.transactionId, {
          title: "Payment Canceled",
          message: `A payment of ${formattedAmount} from ${senderName} was canceled.`,
          data: { transactionId: transaction.transactionId, amount: transaction.amount, senderName },
        });
      }

      if (eventType === "refunded") {
        const refundText = formatCents(transaction.refundAmount, transaction.currency);
        await notificationService.createNotification(senderId, "payment_refunded", transaction.transactionId, {
          title: "Payment Refunded",
          message: `Your refund of ${refundText} for payment to ${receiverName} has been processed.`,
          data: { transactionId: transaction.transactionId, refundAmount: transaction.refundAmount },
        });
        await notificationService.createNotification(receiverId, "payment_refunded", transaction.transactionId, {
          title: "Payment Refunded",
          message: `A refund of ${refundText} for payment from ${senderName} has been processed.`,
          data: { transactionId: transaction.transactionId, refundAmount: transaction.refundAmount },
        });
      }
    } catch (error) {
      console.error("PaymentService.sendTransactionNotifications error:", error);
    }
  }

  static async validateTransactionAccess(identifier, userId) {
    try {
      const transaction = await this.findTransactionByAnyId(identifier);
      if (!transaction) {
        return { valid: false, reason: "Transaction not found" };
      }

      const isParticipant =
        transaction.senderId.toString() === userId.toString() ||
        transaction.receiverId.toString() === userId.toString();

      if (!isParticipant) {
        return { valid: false, reason: "Not authorized to access this transaction" };
      }

      return { valid: true, transaction };
    } catch (error) {
      console.error("PaymentService.validateTransactionAccess error:", error);
      return { valid: false, reason: "Validation error" };
    }
  }
}

export default PaymentService;
