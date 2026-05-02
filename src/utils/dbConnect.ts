import mongoose from "mongoose";
import { DB_NAME } from "../constants/constants";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI env not found");
}

let cached = global.mongoose;

if (!cached) {
  cached = { connection: null, promise: null };
}

const connectDB = async () => {
  if (cached.connection) return cached.connection;

  if (!cached.promise) {
    const options = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };
    cached.promise = mongoose
      .connect(`${MONGODB_URI}/${DB_NAME}`, options)
      .then((m) => m.connection);
  }

  try {
    cached.connection = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("Failed to connect with db ERROR :", error);
    throw error;
  }
  return cached.connection;
};

export default connectDB;
