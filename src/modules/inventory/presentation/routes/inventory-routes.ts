import { Router } from "express";
import { asyncHandler } from "../../../../shared/presentation/middlewares/async-handler.js";
import { validate } from "../../../../shared/presentation/middlewares/validate.js";
import { inventoryController } from "../../inventory-container.js";
import {
  adjustStockSchema,
  createInventoryItemSchema
} from "../validators/inventory-validator.js";

export const inventoryRouter = Router();

inventoryRouter.post(
  "/",
  validate(createInventoryItemSchema),
  asyncHandler(inventoryController.create)
);

inventoryRouter.get(
  "/:variantId",
  asyncHandler(inventoryController.getByVariantId)
);

inventoryRouter.patch(
  "/:variantId/stock",
  validate(adjustStockSchema),
  asyncHandler(inventoryController.adjustStockQuantity)
);