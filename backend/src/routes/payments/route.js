import connectDB from "#root/lib/mongoose.js";
import PaymentService from "#root/services/paymentService.js";
import { getAuthContext } from "#root/lib/auth/authUtils.js";
import { ok, fail } from "#root/lib/response.js";

export async function GET(request) {
  try {
    await connectDB();

    const { user, userId } = await getAuthContext(request);
    if (!user || !userId) {
      return fail("Authentication required", 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const skip = (page - 1) * limit;

    const [result, stats] = await Promise.all([
      PaymentService.getTransactionsByUser(userId, {
        status,
        type,
        limit,
        skip,
        dateFrom,
        dateTo,
      }),
      PaymentService.getTransactionStats(userId, dateFrom, dateTo),
    ]);

    return ok({
      transactions: result.transactions,
      pagination: {
        page,
        limit,
        totalCount: result.totalCount,
        totalPages: Math.ceil(result.totalCount / limit),
        hasMore: result.hasMore,
      },
      stats: {
        totalSent: stats.totalSent || 0,
        totalReceived: stats.totalReceived || 0,
        totalTransactions: stats.totalTransactions || 0,
        successfulTransactions: stats.successfulTransactions || 0,
        failedTransactions: stats.failedTransactions || 0,
      },
    });
  } catch (error) {
    console.error("GET /api/payments error:", error);
    return fail("Internal server error", 500);
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const { user, userId } = await getAuthContext(request);
    if (!user || !userId) {
      return fail("Authentication required", 401);
    }

    const { receiverId, amount, description, connectionId, startupId } =
      await request.json();

    if (!receiverId) return fail("Receiver ID is required", 400);
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return fail("Valid amount is required", 400);
    }
    if (numericAmount < 0.5) return fail("Minimum payment amount is $0.50", 400);
    if (numericAmount > 1000000)
      return fail("Maximum payment amount is $1,000,000", 400);

    const metadata = {};
    if (connectionId) metadata.connectionId = connectionId;
    if (startupId) metadata.startupId = startupId;

    const result = await PaymentService.createTransaction(
      userId,
      receiverId,
      numericAmount,
      description,
      metadata,
    );

    return ok(
      {
        transaction: result.transaction,
        clientSecret: result.clientSecret,
        stripeCustomerId: result.stripeCustomerId,
      },
      201,
    );
  } catch (error) {
    console.error("POST /api/payments error:", error);
    return fail(error?.message || "Failed to create payment transaction", 400);
  }
}
