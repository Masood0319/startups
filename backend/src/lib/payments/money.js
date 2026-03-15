export const MIN_AMOUNT_CENTS = 50; // $0.50
export const MAX_AMOUNT_CENTS = 100000000; // $1,000,000.00

export function toCents(amount) {
  if (typeof amount === "string") {
    amount = amount.trim() === "" ? NaN : Number(amount);
  }

  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new Error("Amount must be a valid number");
  }

  const cents = Math.round(amount * 100);
  return cents;
}

export function fromCents(cents) {
  if (!Number.isInteger(cents)) {
    throw new Error("Cents amount must be an integer");
  }
  return cents / 100;
}

export function assertValidCents(cents) {
  if (!Number.isInteger(cents)) {
    throw new Error("Amount must be an integer number of cents");
  }

  if (cents < MIN_AMOUNT_CENTS) {
    throw new Error("Amount must be at least $0.50");
  }

  if (cents > MAX_AMOUNT_CENTS) {
    throw new Error("Amount cannot exceed $1,000,000");
  }

  return cents;
}

export function formatCents(cents, currency = "USD") {
  if (!Number.isInteger(cents)) {
    throw new Error("Cents amount must be an integer");
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency).toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
