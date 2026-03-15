import { NextResponse } from "next/server";

function readCookieToken(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isPublicPath(pathname) {
  return ["/", "/login", "/signup", "/forgot", "/verify", "/setup"].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function requiredRoleForPath(pathname) {
  if (pathname.startsWith("/fundManagerDashboard")) return "FUND_MANAGER";
  if (pathname.startsWith("/investorDashboard")) return "INVESTOR";
  if (pathname.startsWith("/companyDashboard")) return "FOUNDER";
  return null;
}

function isPublicApiPath(pathname) {
  const publicApiPrefixes = ["/api/auth", "/api/forgot-password"];
  if (publicApiPrefixes.some((p) => pathname.startsWith(p))) return true;
  if (pathname === "/api/payments/webhooks") return true;
  return false;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/investorDashboard") ||
    pathname.startsWith("/fundManagerDashboard") ||
    pathname.startsWith("/companyDashboard");

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = readCookieToken(request);
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const payload = decodeJwtPayload(token);
  const expMs = Number(payload?.exp || 0) * 1000;
  if (!payload || !payload.userId || !payload.role || !expMs || expMs <= Date.now()) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const requiredRole = requiredRoleForPath(pathname);
  if (requiredRole && String(payload.role).toUpperCase() !== requiredRole) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
