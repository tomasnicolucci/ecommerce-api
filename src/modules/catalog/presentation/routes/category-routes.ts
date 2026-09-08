import { Router } from "express";
import { createCategoryController, deactivateCategoryController, getCategoriesController, getCategoryByIdController, updateCategoryController } from "../../catalog-container.js";
import { validate } from "../../../../shared/presentation/middlewares/validate.js";
import { asyncHandler } from "../../../../shared/presentation/middlewares/async-handler.js";
import { createCategorySchema } from "../schemas/create-category-schema.js";
import { updateCategorySchema } from "../schemas/update-category-schema.js";

export const categoryRouter = Router();

categoryRouter.post(
  "/",
  validate(createCategorySchema),
  asyncHandler((req, res) =>
    createCategoryController.handle(req, res)
  )
);

categoryRouter.get(
  "/",
  asyncHandler((req, res) =>
    getCategoriesController.handle(req, res)
  )
);

categoryRouter.get(
  "/:id",
  asyncHandler((req, res) =>
    getCategoryByIdController.handle(req, res)
  )
);

categoryRouter.patch(
  "/:id",
  validate(updateCategorySchema),
  asyncHandler((req, res) =>
    updateCategoryController.handle(req, res)
  )
);

categoryRouter.delete(
  "/:id",
  asyncHandler((req, res) =>
    deactivateCategoryController.handle(req, res)
  )
);