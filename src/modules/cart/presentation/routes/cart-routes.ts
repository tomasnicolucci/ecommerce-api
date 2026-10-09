import {
  Router,
  type RequestHandler
} from "express";
import { asyncHandler } from "../../../../shared/presentation/middlewares/async-handler.js";
import { validate } from "../../../../shared/presentation/middlewares/validate.js";
import { authenticate } from "../../../auth/auth-container.js";
import { cartController } from "../../cart-container.js";
import {
  addCartItemSchema,
  applyCartPromotionSchema,
  updateCartItemQuantitySchema
} from "../validators/cart-validator.js";

export const createCartRouter = (
  authenticationMiddleware: RequestHandler
): Router => {
  const router = Router();

  router.use(authenticationMiddleware);

  router.get(
    "/me",
    asyncHandler(cartController.getActive)
  );

  router.post(
    "/me/items",
    validate(addCartItemSchema),
    asyncHandler(cartController.addItem)
  );

  router.patch(
    "/me/items/:variantId",
    validate(updateCartItemQuantitySchema),
    asyncHandler(cartController.updateItemQuantity)
  );

  router.delete(
    "/me/items/:variantId",
    asyncHandler(cartController.removeItem)
  );

  router.post(
    "/me/promotion",
    validate(applyCartPromotionSchema),
    asyncHandler(cartController.applyPromotion)
  );

  router.delete(
    "/me/promotion",
    asyncHandler(cartController.removePromotion)
  );

  return router;
};

export const cartRouter = createCartRouter(authenticate);