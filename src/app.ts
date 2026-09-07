import express from "express";
import { checkMongoConnection } from "./shared/infrastructure/database/mongodb.js";
import { checkPostgresConnection } from "./shared/infrastructure/database/postgres.js";
import { categoryRouter } from "./modules/catalog/presentation/routes/category-routes.js";
import { errorHandler } from "./shared/presentation/middlewares/error-handler.js";

export const app = express();

app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await Promise.all([
      checkPostgresConnection(),
      checkMongoConnection()
    ]);

    res.status(200).json({
      status: "ok",
      services: {
        postgres: "up",
        mongodb: "up"
      }
    });
  } catch {
    res.status(503).json({
      status: "error"
    });
  }
});

app.use("/categories", categoryRouter);

app.use(errorHandler);