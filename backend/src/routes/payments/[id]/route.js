import connectDB from "#root/lib/mongoose.js";
import PaymentService from "#root/services/paymentService.js";
import { getAuthContext } from "#root/lib/auth/authUtils.js";
import { ok, fail } from "#root/lib/response.js";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { userId } = await getAuthContext(request);
    if (!userId) return fail("Authentication required", 401);

    const transaction = await PaymentService.getTransactionById(params.id, userId);
    return ok({ transaction });
  } catch (error) {
    console.error("GET /api/payments/[id] error:", error);
    const status = error.message?.includes("Not authorized") ? 403 : error.message?.includes("not found") ? 404 : 400;
    return fail(error?.message || "Failed to retrieve transaction", status);
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { userId } = await getAuthContext(request);
    if (!userId) return fail("Authentication required", 401);

    const { action, refundAmount, reason } = await request.json();
    if (!action) return fail("Action is required", 400);

    let transaction;
    if (action === "cancel") {
      transaction = await PaymentService.cancelTransaction(params.id, userId);
      return ok({ transaction });
    }

    if (action === "refund") {
      if (!refundAmount || refundAmount <= 0) {
        return fail("Valid refund amount is required", 400);
      }
      transaction = await PaymentService.refundTransaction(
        params.id,
        refundAmount,
        reason || "Customer request",
        userId,
      );
      return ok({ transaction });
    }

    return fail("Invalid action", 400);
  } catch (error) {
    console.error("PUT /api/payments/[id] error:", error);
    const status = error.message?.includes("not found") ? 404 : error.message?.includes("Only the sender") ? 403 : 400;
    return fail(error?.message || "Failed to update transaction", status);
  }
}
