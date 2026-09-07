import { Router } from "express";
import { createCategoryController } from "../../catalog-container.js";
import { validate } from "../../../../shared/presentation/middlewares/validate.js";
import { asyncHandler } from "../../../../shared/presentation/middlewares/async-handler.js";
import { createCategorySchema } from "../schemas/create-category-schema.js";

export const categoryRouter = Router();

categoryRouter.post(
  "/",
  validate(createCategorySchema),
  asyncHandler((req, res) =>
    createCategoryController.handle(req, res)
  )
);