import { fail } from "#root/lib/response.js";
import { ConnectionServiceError } from "#root/services/connectionService.js";

export function failFromConnectionError(error, fallbackMessage = "Internal server error") {
  if (error instanceof ConnectionServiceError) {
    return fail(error.message, error.status, {
      code: error.code,
      details: error.details || undefined,
    });
  }

  return fail(fallbackMessage, 500, { code: "INTERNAL_ERROR" });
}
