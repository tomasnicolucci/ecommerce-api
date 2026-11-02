import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),

  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number(),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),

  DATABASE_URL: z.string(),

  MONGODB_URI: z.string(),
  MONGODB_TEST_URI: z.string(),

  AUTH_JWKS_URL: z.string().url(),
  AUTH_JWT_ISSUER: z.string(),
  AUTH_JWT_AUDIENCE: z.string(),

  INTERNAL_SYNC_ENABLED: z.enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),

  INTERNAL_SERVICE_SECRET: z.string().optional()
}).superRefine((value, ctx) => {
  if (
    value.INTERNAL_SYNC_ENABLED &&
    (!value.INTERNAL_SERVICE_SECRET ||
      value.INTERNAL_SERVICE_SECRET.length < 32)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["INTERNAL_SERVICE_SECRET"],
      message: "A service secret of at least 32 characters is required"
    });
  }
});

export const env = envSchema.parse(process.env);