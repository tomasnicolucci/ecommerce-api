import {
  Router,
  type RequestHandler
} from "express";
import { authorize } from "../../../access-control/access-control-container.js";
import { authenticate } from "../../../auth/auth-container.js";
import { categoryController } from "../../catalog-container.js";
import { validate } from "../../../../shared/presentation/middlewares/validate.js";
import { asyncHandler } from "../../../../shared/presentation/middlewares/async-handler.js";
import {
  createCategorySchema,
  updateCategorySchema
} from "../validators/category-validator.js";

export const createCategoryRouter = (
  authenticationMiddleware: RequestHandler
): Router => {
  const router = Router();

  router.get(
    "/",
    asyncHandler((req, res) =>
      categoryController.getAll(req, res)
    )
  );

  router.get(
    "/:id",
    asyncHandler((req, res) =>
      categoryController.getById(req, res)
    )
  );

  router.post(
    "/",
    authenticationMiddleware,
    authorize("catalog:manage"),
    validate(createCategorySchema),
    asyncHandler((req, res) =>
      categoryController.create(req, res)
    )
  );

  router.patch(
    "/:id",
    authenticationMiddleware,
    authorize("catalog:manage"),
    validate(updateCategorySchema),
    asyncHandler((req, res) =>
      categoryController.update(req, res)
    )
  );

  router.delete(
    "/:id",
    authenticationMiddleware,
    authorize("catalog:manage"),
    asyncHandler((req, res) =>
      categoryController.deactivate(req, res)
    )
  );

  return router;
};

export const categoryRouter =
  createCategoryRouter(authenticate);