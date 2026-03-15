import mongoose from "mongoose";

export function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

export function toObjectId(value) {
  if (!isValidObjectId(value)) {
    throw new Error("Invalid ObjectId");
  }
  return new mongoose.Types.ObjectId(value);
}
