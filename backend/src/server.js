import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "#root/config/env.js";
import { requestContextMiddleware } from "#root/shims/requestContext.js";
import { errorHandler } from "#root/middleware/errorHandler.js";
import {
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
} from "#root/lib/security/rateLimit.js";

function joinUrl(base, part) {
  if (!base.endsWith("/")) base += "/";
  if (part.startsWith("/")) part = part.slice(1);
  return new URL(part, base).toString();
}

function toExpressPath(routePath) {
  const withoutExt = routePath.replace(/\.route\.(js|ts)$/, "").replace(/\/route\.(js|ts)$/, "");
  const withParams = withoutExt.replace(/\[([^\]]+)\]/g, ":$1");
  return withParams === "" ? "/" : `/${withParams}`;
}

async function collectRouteFiles(dir, rel = "") {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const nextRel = rel ? path.posix.join(rel, entry.name) : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectRouteFiles(full, nextRel)));
      continue;
    }
    if (/route\.(js|ts)$/.test(entry.name)) {
      files.push(nextRel);
    }
  }
  return files;
}

function getRouteLimiters(method, apiPath) {
  if (method !== "POST") return [];

  if (apiPath === "/api/auth/signup" || apiPath === "/api/auth/login") {
    return [authLimiter];
  }

  if (apiPath === "/api/auth/verify") {
    return [otpLimiter];
  }

  if (
    apiPath === "/api/auth/forgot-password" ||
    apiPath === "/api/forgot-password"
  ) {
    return [passwordResetLimiter];
  }

  return [];
}

function toRequest(req) {
  const origin = `${req.protocol}://${req.get("host")}`;
  const url = joinUrl(origin, req.originalUrl);
  const method = req.method.toUpperCase();
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      headers.set(key, value.join(", "));
    } else if (value != null) {
      headers.set(key, String(value));
    }
  }

  let body;
  if (method !== "GET" && method !== "HEAD") {
    if (req.rawBody && req.rawBody.length > 0) {
      body = req.rawBody;
    } else if (req.body != null) {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
    }
  }

  return new Request(url, { method, headers, body });
}

async function sendResponse(fetchResponse, res) {
  if (!(fetchResponse instanceof Response)) {
    return res.status(500).json({ success: false, error: "Invalid route response" });
  }

  res.status(fetchResponse.status);
  fetchResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") return;
    res.setHeader(key, value);
  });

  const bodyText = await fetchResponse.text();
  if (!bodyText) return res.end();

  const contentType = fetchResponse.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return res.json(JSON.parse(bodyText));
    } catch {
      return res.send(bodyText);
    }
  }

  return res.send(bodyText);
}

export async function createApp() {
  const app = express();
  const normalizeOrigin = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";

    try {
      const parsed = new URL(raw);
      return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}`.toLowerCase();
    } catch {
      return raw.replace(/\/+$/, "").toLowerCase();
    }
  };

  const allowedOrigins = [
    process.env.CLIENT_ORIGIN,
    process.env.CORS_ORIGIN,
    config.corsOrigin,
  ]
    .flatMap((value) => String(value || "").split(","))
    .map(normalizeOrigin)
    .filter(Boolean);
  const allowedOriginsSet = new Set(allowedOrigins);

  if (process.env.NODE_ENV !== "production") {
    for (const localOrigin of [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ]) {
      allowedOriginsSet.add(normalizeOrigin(localOrigin));
    }
  }

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        const normalizedOrigin = normalizeOrigin(origin);
        if (allowedOriginsSet.has(normalizedOrigin)) {
          return callback(null, origin);
        }
        if (
          process.env.NODE_ENV !== "production" &&
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedOrigin)
        ) {
          return callback(null, origin);
        }
        return callback(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(cookieParser());
  app.use(
    express.json({
      limit: "5mb",
      verify: (req, _res, buf) => {
        req.rawBody = Buffer.from(buf);
      },
    }),
  );
  app.use(
    express.urlencoded({
      extended: true,
      verify: (req, _res, buf) => {
        req.rawBody = Buffer.from(buf);
      },
    }),
  );
  app.use(requestContextMiddleware);

  const routesRoot = path.resolve(process.cwd(), "src/routes");
  const routeFiles = await collectRouteFiles(routesRoot);

  for (const relPath of routeFiles) {
    const expressPath = toExpressPath(relPath);
    const apiPath = `/api${expressPath}`;
    const fileUrl = pathToFileURL(path.join(routesRoot, relPath)).toString();
    const mod = await import(fileUrl);

    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
      if (typeof mod[method] !== "function") continue;
      const limiters = getRouteLimiters(method, apiPath);
      app[method.toLowerCase()](apiPath, ...limiters, async (req, res, next) => {
        try {
          const request = toRequest(req);
          const response = await mod[method](request, { params: req.params });
          await sendResponse(response, res);
        } catch (error) {
          next(error);
        }
      });
    }
  }

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use(errorHandler);

  return app;
}
