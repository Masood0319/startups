import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

const DB_TO_TOKEN_ROLE = {
  founder: "FOUNDER",
  investor: "INVESTOR",
  fund_manager: "FUND_MANAGER",
  startup: "FOUNDER",
};

const TOKEN_TO_DB_ROLE = {
  FOUNDER: "founder",
  INVESTOR: "investor",
  FUND_MANAGER: "fund_manager",
};

export function toTokenRole(dbRole) {
  const mapped = DB_TO_TOKEN_ROLE[String(dbRole || "").toLowerCase()];
  if (!mapped) {
    throw new Error("Unsupported user role");
  }
  return mapped;
}

export function toDbRole(tokenRole) {
  const mapped = TOKEN_TO_DB_ROLE[String(tokenRole || "").toUpperCase()];
  if (!mapped) {
    throw new Error("Unsupported token role");
  }
  return mapped;
}

export function signAuthToken(user, options = {}) {
  if (!user?._id || !user?.email || !user?.role) {
    throw new Error("Cannot sign token without _id, email, and role");
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
      role: toTokenRole(user.role),
      email: String(user.email).toLowerCase(),
    },
    JWT_SECRET,
    {
      expiresIn: options.expiresIn || "7d",
    },
  );
}

export function verifyAuthToken(token) {
  const payload = jwt.verify(token, JWT_SECRET);

  if (!payload?.userId || !payload?.role || !payload?.email) {
    throw new Error("Invalid token payload");
  }

  return {
    userId: String(payload.userId),
    role: String(payload.role),
    email: String(payload.email).toLowerCase(),
    exp: payload.exp,
    iat: payload.iat,
  };
}
