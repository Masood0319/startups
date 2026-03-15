const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

function toTargetUrl(pathParts, requestUrl) {
  const joinedPath = Array.isArray(pathParts) ? pathParts.join("/") : "";
  const upstream = `${API_BASE}/api/${joinedPath}`.replace(/([^:]\/)\/+/, "$1");
  const incoming = new URL(requestUrl);
  const target = new URL(upstream);
  target.search = incoming.search;
  return target.toString();
}

async function proxy(request, { params }) {
  const pathParts = params?.path || [];
  const targetUrl = toTargetUrl(pathParts, request.url);

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const method = request.method.toUpperCase();
  const init = {
    method,
    headers,
    redirect: "manual",
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstreamRes = await fetch(targetUrl, init);
    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: upstreamRes.headers,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "Upstream API unavailable",
        message: error?.message || "Failed to reach backend API",
      },
      { status: 502 },
    );
  }
}

export const dynamic = "force-dynamic";

export async function GET(request, context) {
  return proxy(request, context);
}

export async function POST(request, context) {
  return proxy(request, context);
}

export async function PUT(request, context) {
  return proxy(request, context);
}

export async function PATCH(request, context) {
  return proxy(request, context);
}

export async function DELETE(request, context) {
  return proxy(request, context);
}

export async function OPTIONS(request, context) {
  return proxy(request, context);
}
