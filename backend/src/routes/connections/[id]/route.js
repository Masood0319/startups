import { getAuthContext } from "#root/lib/auth/authUtils.js";
import connectionService from "#root/services/connectionService.js";
import { ok, fail } from "#root/lib/response.js";
import { failFromConnectionError } from "#root/routes/connections/_utils/connectionErrors.js";

export async function GET(req, { params }) {
  try {
    const { userId } = await getAuthContext(req);
    if (!userId) return fail("Authentication required", 401);

    const connectionId = params?.id;
    if (!connectionId) return fail("Connection ID is required", 400);

    const connection = await connectionService.getConnectionById(connectionId, userId);
    return ok({ connection });
  } catch (error) {
    console.error("GET /api/connections/[id] error:", error);
    return failFromConnectionError(error);
  }
}

export async function DELETE(req, { params }) {
  try {
    const { userId } = await getAuthContext(req);
    if (!userId) return fail("Authentication required", 401);

    const connectionId = params?.id;
    if (!connectionId) return fail("Connection ID is required", 400);

    const connection = await connectionService.updateConnectionStatus(
      connectionId,
      userId,
      "withdrawn",
    );

    return ok({ connection });
  } catch (error) {
    console.error("DELETE /api/connections/[id] error:", error);
    return failFromConnectionError(error);
  }
}
