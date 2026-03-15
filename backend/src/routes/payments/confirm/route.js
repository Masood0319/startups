import connectDB from "#root/lib/mongoose.js";
import PaymentService from "#root/services/paymentService.js";
import { getAuthContext } from "#root/lib/auth/authUtils.js";
import { ok, fail } from "#root/lib/response.js";

export async function POST(request) {
  try {
    await connectDB();

    const { userId } = await getAuthContext(request);
    if (!userId) return fail("Authentication required", 401);

    const { transactionId, paymentIntentId } = await request.json();
    if (!transactionId && !paymentIntentId) {
      return fail("Transaction ID or Payment Intent ID is required", 400);
    }

    // Authorization check before confirm side-effects.
    const access = await PaymentService.validateTransactionAccess(
      transactionId || paymentIntentId,
      userId,
    );
    if (!access.valid) {
      const status = access.reason === "Transaction not found" ? 404 : 403;
      return fail(access.reason || "Not authorized", status);
    }
    if (access.transaction.senderId.toString() !== userId) {
      return fail("Not authorized to confirm this transaction", 403);
    }

    const transaction = await PaymentService.confirmTransaction(
      transactionId,
      paymentIntentId,
    );

    return ok({ transaction });
  } catch (error) {
    console.error("POST /api/payments/confirm error:", error);
    return fail(error?.message || "Failed to confirm payment", 400);
  }
}
