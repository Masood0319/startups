const TOO_MANY_REQUESTS_MESSAGE = "Too many requests. Please try again later.";

let createExpressRateLimit = null;
try {
  const mod = await import("express-rate-limit");
  createExpressRateLimit = mod.default ?? mod.rateLimit ?? mod;
} catch {
  createExpressRateLimit = null;
}

function tooManyRequestsResponse(res) {
  return res.status(429).json({
    success: false,
    message: TOO_MANY_REQUESTS_MESSAGE,
  });
}

function createFallbackLimiter({ windowMs, max }) {
  const hits = new Map();

  return function fallbackRateLimiter(req, res, next) {
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      return tooManyRequestsResponse(res);
    }

    current.count += 1;
    return next();
  };
}

function createLimiter({ windowMs, max }) {
  if (createExpressRateLimit) {
    return createExpressRateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => tooManyRequestsResponse(res),
    });
  }

  return createFallbackLimiter({ windowMs, max });
}

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

export const otpLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
});

export const passwordResetLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
});

