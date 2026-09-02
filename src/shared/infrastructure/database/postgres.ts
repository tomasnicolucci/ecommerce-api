import { Pool } from "pg";
import { env } from "../../../config/env.js";

export const postgresPool = new Pool({
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD
});

export const checkPostgresConnection = async (): Promise<void> => {
  const client = await postgresPool.connect();

  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
};