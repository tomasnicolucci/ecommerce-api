import {
  Router,
  type RequestHandler
} from "express";
import { validate } from "../../../../shared/presentation/middlewares/validate.js";
import { asyncHandler } from "../../../../shared/presentation/middlewares/async-handler.js";
import { authenticate } from "../../../auth/auth-container.js";
import { customerController } from "../../customers-container.js";
import {
  createCustomerSchema,
  updateCustomerSchema
} from "../validators/customer-validator.js";

export const createCustomerRouter = (
  authenticationMiddleware: RequestHandler
): Router => {
  const router = Router();

  router.use(authenticationMiddleware);

  router.post(
    "/me",
    validate(createCustomerSchema),
    asyncHandler((req, res) =>
      customerController.create(req, res)
    )
  );

  router.get(
    "/me",
    asyncHandler((req, res) =>
      customerController.getMe(req, res)
    )
  );

  router.patch(
    "/me",
    validate(updateCustomerSchema),
    asyncHandler((req, res) =>
      customerController.updateMe(req, res)
    )
  );

  return router;
};

export const customerRouter =
  createCustomerRouter(authenticate);