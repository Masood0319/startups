import bcrypt from "bcrypt";
import mongoose, { ClientSession } from "mongoose";
import connectDB from "#root/lib/mongoose.js";
import User from "#root/models/User.js";
import Investor from "#root/models/Investor.js";
import Founder from "#root/models/Founder.js";
import { signAuthToken } from "#root/lib/auth/jwt.js";

export type SignupRole = "INVESTOR" | "FOUNDER" | "FUND_MANAGER";

const ROLE_TO_DB = {
  INVESTOR: "investor",
  FOUNDER: "founder",
  FUND_MANAGER: "fund_manager",
} as const;

type InvestorProfileInput = {
  industries?: string[];
  ticketSizeMin?: number;
  ticketSizeMax?: number;
  bio?: string;
};

type FounderProfileInput = {
  experience?: string;
  linkedin?: string;
  bio?: string;
};

export type SignupInput = {
  name: string;
  email: string;
  password: string;
  role: SignupRole;
  investor?: InvestorProfileInput;
  founder?: FounderProfileInput;
};

export type SignupResult = {
  userId: string;
  role: SignupRole;
  token: string;
};

export class SignupError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "SignupError";
    this.statusCode = statusCode;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateInput(input: SignupInput): void {
  if (!input.name?.trim()) {
    throw new SignupError("Name is required", 400);
  }

  const email = normalizeEmail(input.email || "");
  if (!email || !email.includes("@")) {
    throw new SignupError("Valid email is required", 400);
  }

  if (!input.password || input.password.length < 6) {
    throw new SignupError("Password must be at least 6 characters", 400);
  }

  if (!input.role || !(input.role in ROLE_TO_DB)) {
    throw new SignupError("Invalid role", 400);
  }

  if (
    input.role === "INVESTOR" &&
    input.investor?.ticketSizeMin != null &&
    input.investor?.ticketSizeMax != null &&
    input.investor.ticketSizeMin > input.investor.ticketSizeMax
  ) {
    throw new SignupError("ticketSizeMin cannot be greater than ticketSizeMax", 400);
  }
}

async function createRoleProfile(
  userId: mongoose.Types.ObjectId,
  role: SignupRole,
  input: SignupInput,
  session: ClientSession,
): Promise<void> {
  if (role === "INVESTOR") {
    await Investor.create(
      [
        {
          userId,
          industries: input.investor?.industries ?? [],
          ticketSizeMin: input.investor?.ticketSizeMin ?? 0,
          ticketSizeMax: input.investor?.ticketSizeMax ?? 0,
          bio: input.investor?.bio,
        },
      ],
      { session },
    );
    return;
  }

  if (role === "FOUNDER") {
    await Founder.create(
      [
        {
          userId,
          experience: input.founder?.experience,
          linkedin: input.founder?.linkedin,
          bio: input.founder?.bio,
        },
      ],
      { session },
    );
  }
}

function toSignupError(error: unknown): SignupError {
  if (error instanceof SignupError) {
    return error;
  }

  if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
    const duplicatedFields = Object.keys(error.keyPattern || {});
    if (duplicatedFields.includes("email")) {
      return new SignupError("Email already in use", 409);
    }
    if (duplicatedFields.includes("userId")) {
      return new SignupError("Profile already exists for this user", 409);
    }
    return new SignupError("Duplicate key error", 409);
  }

  return new SignupError("Internal server error", 500);
}

export async function signupUser(input: SignupInput): Promise<SignupResult> {
  validateInput(input);
  await connectDB();

  const email = normalizeEmail(input.email);
  const hashedPassword = await bcrypt.hash(input.password, 10);
  const roleForDb = ROLE_TO_DB[input.role];

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingUser = await User.findOne({ email }).session(session).lean();
    if (existingUser) {
      throw new SignupError("Email already in use", 409);
    }

    const [user] = await User.create(
      [
        {
          full_name: input.name.trim(),
          email,
          password: hashedPassword,
          role: roleForDb,
          status: "verified",
        },
      ],
      { session },
    );

    await createRoleProfile(user._id, input.role, input, session);

    await session.commitTransaction();

    const token = signAuthToken(
      { _id: user._id, email: user.email, role: user.role },
      { expiresIn: "7d" },
    );

    return {
      userId: user._id.toString(),
      role: input.role,
      token,
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw toSignupError(error);
  } finally {
    await session.endSession();
  }
}
