import mongoose from "mongoose";
import { env } from "../../../config/env.js";

export const connectMongoDB = async (): Promise<void> => {
  await mongoose.connect(env.MONGODB_URI);
};

export const checkMongoConnection = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB is not connected");
  }
};