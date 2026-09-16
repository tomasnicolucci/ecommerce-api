import { Router } from "express";
import { productController } from "../../catalog-container.js";
import { validate } from "../../../../shared/presentation/middlewares/validate.js";
import { asyncHandler } from "../../../../shared/presentation/middlewares/async-handler.js";
import { createProductSchema, updateProductSchema } from "../validators/product-validator.js";

export const productRouter = Router();

productRouter.post(
  "/",
  validate(createProductSchema),
  asyncHandler((req, res) =>
    productController.create(req, res)
  )
);

productRouter.get(
  "/",
  asyncHandler((req, res) =>
    productController.getAll(req, res)
  )
);

productRouter.get(
  "/:id",
  asyncHandler((req, res) =>
    productController.getById(req, res)
  )
);

productRouter.patch(
  "/:id",
  validate(updateProductSchema),
  asyncHandler((req, res) =>
    productController.update(req, res)
  )
);

productRouter.delete(
  "/:id",
  asyncHandler((req, res) =>
    productController.delete(req, res)
  )
);