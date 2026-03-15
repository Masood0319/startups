import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI?.trim();
const DB_NAME_FROM_ENV = process.env.MONGODB_DB?.trim();

function getDbNameFromUri(uri) {
  try {
    const parsed = new URL(uri);
    const pathName = parsed.pathname || "";
    if (!pathName || pathName === "/") return null;
    return decodeURIComponent(pathName.slice(1));
  } catch {
    return null;
  }
}

function resolveDbName(uri) {
  return DB_NAME_FROM_ENV || getDbNameFromUri(uri) || "startups";
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("❌ MONGODB_URI is missing in environment variables");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const dbName = resolveDbName(MONGODB_URI);
    const opts = {
      bufferCommands: false,
      dbName,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("📦 MongoDB Connected via Mongoose to:", dbName);
        return mongoose;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
