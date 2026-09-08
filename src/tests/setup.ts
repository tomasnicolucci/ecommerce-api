import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { env } from "../config/env.js";

beforeAll(async () => {
  await mongoose.connect(env.MONGODB_TEST_URI);
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;

  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});