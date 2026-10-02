import {
  Router,
  type RequestHandler
} from "express";
import { authorize } from "../../../access-control/access-control-container.js";
import { authenticate } from "../../../auth/auth-container.js";
import { asyncHandler } from "../../../../shared/presentation/middlewares/async-handler.js";
import { validate } from "../../../../shared/presentation/middlewares/validate.js";
import { inventoryController } from "../../inventory-container.js";
import {
  adjustStockSchema,
  createInventoryItemSchema
} from "../validators/inventory-validator.js";

export const createInventoryRouter = (
  authenticationMiddleware: RequestHandler
): Router => {
  const router = Router();

  router.use(authenticationMiddleware);
  router.use(
    authorize("inventory:manage")
  );

  router.post(
    "/",
    validate(createInventoryItemSchema),
    asyncHandler(inventoryController.create)
  );

  router.get(
    "/:variantId",
    asyncHandler(inventoryController.getByVariantId)
  );

  router.patch(
    "/:variantId/stock",
    validate(adjustStockSchema),
    asyncHandler(
      inventoryController.adjustStockQuantity
    )
  );

  return router;
};

export const inventoryRouter =
  createInventoryRouter(authenticate);