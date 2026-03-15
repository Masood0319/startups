import mongoose from "mongoose";
import connectDB from "../../lib/mongoose.js";

function asObjectId(value) {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
}

function buildParticipantKey(userA, userB) {
  const a = userA.toString();
  const b = userB.toString();
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

async function migrateConnections(db) {
  const col = db.collection("connections");
  const cursor = col.find({});
  const ops = [];

  for await (const doc of cursor) {
    const userA = asObjectId(doc.userA);
    const userB = asObjectId(doc.userB);
    const initiatedBy = asObjectId(doc.initiatedBy);
    const startupId = asObjectId(doc.startupId);

    if (!userA || !userB || !initiatedBy) continue;

    const participantKey = buildParticipantKey(userA, userB);
    const set = {};
    if (!(doc.userA instanceof mongoose.Types.ObjectId)) set.userA = userA;
    if (!(doc.userB instanceof mongoose.Types.ObjectId)) set.userB = userB;
    if (!(doc.initiatedBy instanceof mongoose.Types.ObjectId)) {
      set.initiatedBy = initiatedBy;
    }
    if (doc.startupId && !(doc.startupId instanceof mongoose.Types.ObjectId)) {
      set.startupId = startupId;
    }
    if (doc.participantKey !== participantKey) {
      set.participantKey = participantKey;
    }

    if (Object.keys(set).length) {
      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: set },
        },
      });
    }
  }

  if (ops.length) await col.bulkWrite(ops, { ordered: false });
  return ops.length;
}

async function migrateMessages(db) {
  const col = db.collection("messages");
  const cursor = col.find({});
  const ops = [];

  for await (const doc of cursor) {
    const senderId = asObjectId(doc.senderId);
    const receiverId = asObjectId(doc.receiverId);
    const connectionId = asObjectId(doc.connectionId);
    const threadId = asObjectId(doc.threadId) || connectionId;
    const replyTo = asObjectId(doc.replyTo);

    if (!senderId || !receiverId || !connectionId) continue;

    const set = {};
    if (!(doc.senderId instanceof mongoose.Types.ObjectId)) set.senderId = senderId;
    if (!(doc.receiverId instanceof mongoose.Types.ObjectId)) set.receiverId = receiverId;
    if (!(doc.connectionId instanceof mongoose.Types.ObjectId)) {
      set.connectionId = connectionId;
    }
    if (!doc.threadId || !(doc.threadId instanceof mongoose.Types.ObjectId)) {
      set.threadId = threadId;
    }
    if (doc.replyTo && !(doc.replyTo instanceof mongoose.Types.ObjectId) && replyTo) {
      set.replyTo = replyTo;
    }

    if (Object.keys(set).length) {
      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: set },
        },
      });
    }
  }

  if (ops.length) await col.bulkWrite(ops, { ordered: false });
  return ops.length;
}

async function migrateNotifications(db) {
  const col = db.collection("notifications");
  const cursor = col.find({});
  const ops = [];

  for await (const doc of cursor) {
    const set = {};
    const userId = asObjectId(doc.userId);
    const relatedUserId = asObjectId(doc.relatedUserId);
    const relatedConnectionId = asObjectId(doc.relatedConnectionId);
    const relatedMessageId = asObjectId(doc.relatedMessageId);
    const relatedStartupId = asObjectId(doc.relatedStartupId);

    if (userId && !(doc.userId instanceof mongoose.Types.ObjectId)) set.userId = userId;
    if (doc.relatedUserId && !(doc.relatedUserId instanceof mongoose.Types.ObjectId) && relatedUserId) {
      set.relatedUserId = relatedUserId;
    }
    if (
      doc.relatedConnectionId &&
      !(doc.relatedConnectionId instanceof mongoose.Types.ObjectId) &&
      relatedConnectionId
    ) {
      set.relatedConnectionId = relatedConnectionId;
    }
    if (doc.relatedMessageId && !(doc.relatedMessageId instanceof mongoose.Types.ObjectId) && relatedMessageId) {
      set.relatedMessageId = relatedMessageId;
    }
    if (doc.relatedStartupId && !(doc.relatedStartupId instanceof mongoose.Types.ObjectId) && relatedStartupId) {
      set.relatedStartupId = relatedStartupId;
    }

    if (Object.keys(set).length) {
      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: set },
        },
      });
    }
  }

  if (ops.length) await col.bulkWrite(ops, { ordered: false });
  return ops.length;
}

async function migrateInvestments(db) {
  const col = db.collection("investments");
  const cursor = col.find({});
  const ops = [];

  for await (const doc of cursor) {
    const set = {};
    const investorId = asObjectId(doc.investorId);
    const startupId = asObjectId(doc.startupId);
    const createdBy = asObjectId(doc.createdBy);

    if (investorId && !(doc.investorId instanceof mongoose.Types.ObjectId)) {
      set.investorId = investorId;
    }
    if (startupId && !(doc.startupId instanceof mongoose.Types.ObjectId)) {
      set.startupId = startupId;
    }
    if (createdBy && !(doc.createdBy instanceof mongoose.Types.ObjectId)) {
      set.createdBy = createdBy;
    }

    if (Object.keys(set).length) {
      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: set },
        },
      });
    }
  }

  if (ops.length) await col.bulkWrite(ops, { ordered: false });
  return ops.length;
}

async function migrateContracts(db) {
  const col = db.collection("contracts");
  const cursor = col.find({});
  const ops = [];

  for await (const doc of cursor) {
    const set = {};
    const investmentId = asObjectId(doc.investmentId);
    const investorId = asObjectId(doc.investorId);
    const startupId = asObjectId(doc.startupId);
    const createdBy = asObjectId(doc.createdBy);

    if (investmentId && !(doc.investmentId instanceof mongoose.Types.ObjectId)) {
      set.investmentId = investmentId;
    }
    if (investorId && !(doc.investorId instanceof mongoose.Types.ObjectId)) {
      set.investorId = investorId;
    }
    if (startupId && !(doc.startupId instanceof mongoose.Types.ObjectId)) {
      set.startupId = startupId;
    }
    if (createdBy && !(doc.createdBy instanceof mongoose.Types.ObjectId)) {
      set.createdBy = createdBy;
    }

    if (Object.keys(set).length) {
      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: set },
        },
      });
    }
  }

  if (ops.length) await col.bulkWrite(ops, { ordered: false });
  return ops.length;
}

async function migrateInvestorProfiles(db) {
  const col = db.collection("investors");
  const cursor = col.find({});
  const ops = [];

  for await (const doc of cursor) {
    const set = {};
    const unset = {};

    const userId = asObjectId(doc.userId);
    if (userId && !(doc.userId instanceof mongoose.Types.ObjectId)) {
      set.userId = userId;
    }

    if (doc.email != null) unset.email = "";
    if (doc.full_name != null) unset.full_name = "";
    if (doc.avatar != null) unset.avatar = "";
    if (doc.location != null) unset.location = "";
    if (doc.role != null) unset.role = "";

    if (Object.keys(set).length || Object.keys(unset).length) {
      const update = {};
      if (Object.keys(set).length) update.$set = set;
      if (Object.keys(unset).length) update.$unset = unset;

      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update,
        },
      });
    }
  }

  if (ops.length) await col.bulkWrite(ops, { ordered: false });
  return ops.length;
}

async function run() {
  await connectDB();
  const db = mongoose.connection.db;

  console.log("Connected. Starting normalization migration...");
  const results = {};
  results.connections = await migrateConnections(db);
  results.messages = await migrateMessages(db);
  results.notifications = await migrateNotifications(db);
  results.investments = await migrateInvestments(db);
  results.contracts = await migrateContracts(db);
  results.investorProfiles = await migrateInvestorProfiles(db);

  console.log("Migration completed.");
  console.table(results);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Migration failed:", error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
