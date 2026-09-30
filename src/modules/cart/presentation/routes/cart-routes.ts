import { Router } from "express";
import { asyncHandler } from "../../../../shared/presentation/middlewares/async-handler.js";
import { validate } from "../../../../shared/presentation/middlewares/validate.js";
import { cartController } from "../../cart-container.js";
import {
  addCartItemSchema,
  updateCartItemQuantitySchema
} from "../validators/cart-validator.js";

export const cartRouter = Router();

cartRouter.get(
  "/:customerId",
  asyncHandler(cartController.getActive)
);

cartRouter.post(
  "/:customerId/items",
  validate(addCartItemSchema),
  asyncHandler(cartController.addItem)
);

cartRouter.patch(
  "/:customerId/items/:variantId",
  validate(updateCartItemQuantitySchema),
  asyncHandler(cartController.updateItemQuantity)
);

cartRouter.delete(
  "/:customerId/items/:variantId",
  asyncHandler(cartController.removeItem)
);