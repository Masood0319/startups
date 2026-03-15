import { cookies } from "#root/shims/nextHeaders.js";
import { getExpiredCookieOptions } from "#root/lib/auth/cookieOptions.js";
import { ok } from "#root/lib/response.js";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("token", "", getExpiredCookieOptions());

  return ok({ loggedOut: true });
}
