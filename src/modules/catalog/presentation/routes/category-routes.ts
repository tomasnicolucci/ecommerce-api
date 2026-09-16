import { Router } from "express";
import { categoryController } from "../../catalog-container.js";
import { validate } from "../../../../shared/presentation/middlewares/validate.js";
import { asyncHandler } from "../../../../shared/presentation/middlewares/async-handler.js";
import { createCategorySchema, updateCategorySchema } from "../validators/category-validator.js";

export const categoryRouter = Router();

categoryRouter.post(
  "/",
  validate(createCategorySchema),
  asyncHandler((req, res) =>
    categoryController.create(req, res)
  )
);

categoryRouter.get(
  "/",
  asyncHandler((req, res) =>
    categoryController.getAll(req, res)
  )
);

categoryRouter.get(
  "/:id",
  asyncHandler((req, res) =>
    categoryController.getById(req, res)
  )
);

categoryRouter.patch(
  "/:id",
  validate(updateCategorySchema),
  asyncHandler((req, res) =>
    categoryController.update(req, res)
  )
);

categoryRouter.delete(
  "/:id",
  asyncHandler((req, res) =>
    categoryController.deactivate(req, res)
  )
);