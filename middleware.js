import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// Utility: get token from cookie
function getTokenFromRequest(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  // Public routes — no protection
  const publicPaths = ["/", "/login", "/signup"];
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Protect dashboards
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/investorDashboard") ||
    pathname.startsWith("/fundManagerDashboard") ||
    pathname.startsWith("/companyDashboard")
  ) {
    const token = getTokenFromRequest(request);

    if (!token) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const role = payload?.role; // if stored in token

      // 🔹 Optional: Role-based redirection
      if (pathname.startsWith("/fundManagerDashboard") && role !== "fund_manager") {
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }

      if (pathname.startsWith("/investorDashboard") && role !== "investor") {
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }

      if (pathname.startsWith("/companyDashboard") && role !== "founder") {
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }

      return NextResponse.next();
    } catch {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)", // applies to all routes except static
  ],
};