import { getRequestContext } from "#root/shims/requestContext.js";

function parseCookies(raw = "") {
  const out = {};
  for (const part of String(raw || "").split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join("=") || "");
  }
  return out;
}

export async function cookies() {
  const ctx = getRequestContext();
  if (!ctx?.req || !ctx?.res) {
    return {
      get() {
        return undefined;
      },
      set() {},
      delete() {},
    };
  }

  const jar = parseCookies(ctx.req.headers?.cookie || "");

  return {
    get(name) {
      if (!(name in jar)) return undefined;
      return { name, value: jar[name] };
    },
    set(name, value, options = {}) {
      const normalizedOptions = { ...options };
      if (typeof normalizedOptions.maxAge === "number") {
        // Next cookie maxAge is seconds; Express expects milliseconds.
        normalizedOptions.maxAge = normalizedOptions.maxAge * 1000;
      }
      ctx.res.cookie(name, value, normalizedOptions);
      jar[name] = value;
    },
    delete(name, options = {}) {
      ctx.res.clearCookie(name, options);
      delete jar[name];
    },
  };
}

export async function headers() {
  const ctx = getRequestContext();
  const headersObj = ctx?.req?.headers || {};
  return {
    get(name) {
      const value = headersObj[String(name).toLowerCase()];
      if (Array.isArray(value)) return value.join(", ");
      return value ?? null;
    },
  };
}
