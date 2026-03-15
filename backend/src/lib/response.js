import { NextResponse } from "#root/shims/nextServer.js";

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function toSerializableId(value) {
  if (value == null) return value;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && typeof value.toString === "function") {
    const asString = value.toString();
    if (asString !== "[object Object]") return asString;
  }
  return value;
}

function normalizeEntity(value) {
  if (value == null) return value;

  if (Array.isArray(value)) {
    return value.map(normalizeEntity);
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "object" && typeof value.toObject === "function") {
    return normalizeEntity(value.toObject());
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const output = {};
  const hasUnderscoreId = Object.prototype.hasOwnProperty.call(value, "_id");
  const hasId = Object.prototype.hasOwnProperty.call(value, "id");

  if (hasUnderscoreId && !hasId) {
    output.id = toSerializableId(value._id);
  } else if (hasId) {
    output.id = toSerializableId(value.id);
  }

  for (const [key, fieldValue] of Object.entries(value)) {
    if (key === "_id" || key === "__v") continue;
    if (key === "id" && output.id !== undefined) continue;
    output[key] = normalizeEntity(fieldValue);
  }

  return output;
}

function normalizeMeta(meta) {
  if (!isPlainObject(meta)) return normalizeEntity(meta);

  const normalized = normalizeEntity(meta);
  const page = normalized?.page;
  const limit = normalized?.limit;
  const total = normalized?.total ?? normalized?.count;

  if (
    Number.isFinite(Number(page)) &&
    Number.isFinite(Number(limit)) &&
    Number.isFinite(Number(total))
  ) {
    const nextMeta = { ...normalized };
    delete nextMeta.page;
    delete nextMeta.limit;
    delete nextMeta.count;
    if (nextMeta.total === undefined) delete nextMeta.total;
    nextMeta.pagination = {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
    };
    return nextMeta;
  }

  return normalized;
}

export function success(data, meta = undefined, status = 200) {
  let normalizedData = normalizeEntity(data);
  let normalizedMeta = meta;

  if (
    normalizedMeta === undefined &&
    isPlainObject(normalizedData) &&
    Object.prototype.hasOwnProperty.call(normalizedData, "meta")
  ) {
    normalizedMeta = normalizedData.meta;
    const { meta: _ignoredMeta, ...restData } = normalizedData;
    normalizedData = restData;
  }

  const payload = {
    success: true,
    data: normalizedData,
  };
  if (normalizedMeta !== undefined) {
    payload.meta = normalizeMeta(normalizedMeta);
  }

  return NextResponse.json(payload, { status });
}

export function error(message, status = 400, meta = undefined) {
  let normalizedMessage = message;
  if (typeof normalizedMessage !== "string") {
    normalizedMessage =
      normalizedMessage?.message ||
      normalizedMessage?.error ||
      "Request failed";
  }

  const payload = {
    success: false,
    error: normalizedMessage,
  };
  if (meta !== undefined) {
    payload.meta = normalizeEntity(meta);
  }

  return NextResponse.json(payload, { status });
}

// Backward-compatible aliases.
export function ok(data, status = 200, meta = undefined) {
  return success(data, meta, status);
}

export function fail(message, status = 400, meta = undefined) {
  return error(message, status, meta);
}
