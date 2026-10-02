import {
  Router,
  type RequestHandler
} from "express";
import { authorize } from "../../../access-control/access-control-container.js";
import { authenticate } from "../../../auth/auth-container.js";
import { productController } from "../../catalog-container.js";
import { validate } from "../../../../shared/presentation/middlewares/validate.js";
import { asyncHandler } from "../../../../shared/presentation/middlewares/async-handler.js";
import {
  createProductSchema,
  createProductVariantSchema,
  updateProductSchema,
  updateProductVariantSchema
} from "../validators/product-validator.js";

export const createProductRouter = (
  authenticationMiddleware: RequestHandler
): Router => {
  const router = Router();

  router.get(
    "/",
    asyncHandler((req, res) =>
      productController.getAll(req, res)
    )
  );

  router.get(
    "/:id",
    asyncHandler((req, res) =>
      productController.getById(req, res)
    )
  );

  router.get(
    "/:productId/variants",
    asyncHandler((req, res) =>
      productController.getVariants(req, res)
    )
  );

  router.get(
    "/:productId/variants/:variantId",
    asyncHandler((req, res) =>
      productController.getVariantById(req, res)
    )
  );

  router.post(
    "/",
    authenticationMiddleware,
    authorize("catalog:manage"),
    validate(createProductSchema),
    asyncHandler((req, res) =>
      productController.create(req, res)
    )
  );

  router.patch(
    "/:id",
    authenticationMiddleware,
    authorize("catalog:manage"),
    validate(updateProductSchema),
    asyncHandler((req, res) =>
      productController.update(req, res)
    )
  );

  router.delete(
    "/:id",
    authenticationMiddleware,
    authorize("catalog:manage"),
    asyncHandler((req, res) =>
      productController.delete(req, res)
    )
  );

  router.post(
    "/:productId/variants",
    authenticationMiddleware,
    authorize("catalog:manage"),
    validate(createProductVariantSchema),
    asyncHandler((req, res) =>
      productController.createVariant(req, res)
    )
  );

  router.patch(
    "/:productId/variants/:variantId",
    authenticationMiddleware,
    authorize("catalog:manage"),
    validate(updateProductVariantSchema),
    asyncHandler((req, res) =>
      productController.updateVariant(req, res)
    )
  );

  router.delete(
    "/:productId/variants/:variantId",
    authenticationMiddleware,
    authorize("catalog:manage"),
    asyncHandler((req, res) =>
      productController.deleteVariant(req, res)
    )
  );

  return router;
};

export const productRouter =
  createProductRouter(authenticate);