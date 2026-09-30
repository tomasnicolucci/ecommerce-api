import { Router } from "express";
import { validate } from "../../../../shared/presentation/middlewares/validate.js";
import { asyncHandler } from "../../../../shared/presentation/middlewares/async-handler.js";
import { customerController } from "../../customers-container.js";
import {
  createCustomerSchema,
  updateCustomerSchema
} from "../validators/customer-validator.js";
import { authenticate } from "../../../auth/auth-container.js";

export const customerRouter = Router();

customerRouter.use(authenticate);

customerRouter.post(
  "/",
  validate(createCustomerSchema),
  asyncHandler((req, res) =>
    customerController.create(req, res)
  )
);

customerRouter.get(
  "/user/:userId",
  asyncHandler((req, res) =>
    customerController.getByUserId(req, res)
  )
);

customerRouter.get(
  "/:id",
  asyncHandler((req, res) =>
    customerController.getById(req, res)
  )
);

customerRouter.patch(
  "/:id",
  validate(updateCustomerSchema),
  asyncHandler((req, res) =>
    customerController.update(req, res)
  )
);