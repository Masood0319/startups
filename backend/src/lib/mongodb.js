import connectDB from "#root/lib/mongoose.js";

// Compatibility shim for legacy imports.
// This module intentionally avoids MongoClient usage and runtime index creation.

export default connectDB;

export async function getDb() {
  throw new Error("getDb is deprecated. Use Mongoose models.");
}

export async function getUsersCollection() {
  throw new Error("getUsersCollection is deprecated. Use Mongoose models.");
}

export async function getConnectionsCollection() {
  throw new Error("getConnectionsCollection is deprecated. Use Mongoose models.");
}

export async function getMessagesCollection() {
  throw new Error("getMessagesCollection is deprecated. Use Mongoose models.");
}

export async function getStartupsCollection() {
  throw new Error("getStartupsCollection is deprecated. Use Mongoose models.");
}

export async function getInvestorsCollection() {
  throw new Error("getInvestorsCollection is deprecated. Use Mongoose models.");
}
