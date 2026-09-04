import { Router } from "express";
import { createCategoryController } from "../../catalog-container.js";
import { validate } from "../../../../shared/presentation/middlewares/validate.js";
import { createCategorySchema } from "../schemas/create-category-schema.js";

export const categoryRouter = Router();

categoryRouter.post(
  "/",
  validate(createCategorySchema),
  async (req, res, next) => {
    try {
      await createCategoryController.handle(req, res);
    } catch (error) {
      next(error);
    }
  }
);