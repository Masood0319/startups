export const CONNECTION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
};

const LEGACY_STATUS_ALIASES = {
  declined: CONNECTION_STATUS.REJECTED,
  requested: CONNECTION_STATUS.PENDING,
};

export const CONNECTION_TRANSITIONS = Object.freeze({
  [CONNECTION_STATUS.PENDING]: new Set([
    CONNECTION_STATUS.ACCEPTED,
    CONNECTION_STATUS.REJECTED,
    CONNECTION_STATUS.WITHDRAWN,
  ]),
  [CONNECTION_STATUS.ACCEPTED]: new Set(),
  [CONNECTION_STATUS.REJECTED]: new Set(),
  [CONNECTION_STATUS.WITHDRAWN]: new Set(),
});

export function normalizeConnectionStatus(status) {
  if (!status || typeof status !== "string") return null;
  const normalized = status.trim().toLowerCase();
  return LEGACY_STATUS_ALIASES[normalized] || normalized;
}

export function isKnownConnectionStatus(status) {
  const normalized = normalizeConnectionStatus(status);
  return !!normalized && Object.hasOwn(CONNECTION_TRANSITIONS, normalized);
}

export function canTransitionConnection(fromStatus, toStatus) {
  const from = normalizeConnectionStatus(fromStatus);
  const to = normalizeConnectionStatus(toStatus);

  if (!from || !to) return false;
  if (!Object.hasOwn(CONNECTION_TRANSITIONS, from)) return false;
  if (!Object.hasOwn(CONNECTION_TRANSITIONS, to)) return false;

  return CONNECTION_TRANSITIONS[from].has(to);
}

export function assertConnectionTransition(fromStatus, toStatus) {
  if (!canTransitionConnection(fromStatus, toStatus)) {
    const from = normalizeConnectionStatus(fromStatus) || String(fromStatus);
    const to = normalizeConnectionStatus(toStatus) || String(toStatus);
    const allowed = CONNECTION_TRANSITIONS[from]
      ? [...CONNECTION_TRANSITIONS[from]]
      : [];

    return {
      ok: false,
      from,
      to,
      allowed,
    };
  }

  return {
    ok: true,
    from: normalizeConnectionStatus(fromStatus),
    to: normalizeConnectionStatus(toStatus),
    allowed: [...CONNECTION_TRANSITIONS[normalizeConnectionStatus(fromStatus)]],
  };
}
