import mongoose from "mongoose";
import { env } from "./env.js";

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export async function connectDB(uri = env.mongoUri) {
  try {
    await mongoose.connect(uri, {
      autoIndex: !env.isProduction,
      serverSelectionTimeoutMS: 3000
    });
    console.log("MongoDB connection established.");
    return true;
  } catch (error) {
    console.error(`MongoDB unavailable: ${error.message}`);
    return false;
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}
