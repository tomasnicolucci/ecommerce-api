import { Router, type RequestHandler } from "express";
import { authorize } from "../../../access-control/access-control-container.js";
import { authenticate } from "../../../auth/auth-container.js";
import { asyncHandler } from "../../../../shared/presentation/middlewares/async-handler.js";
import { validate } from "../../../../shared/presentation/middlewares/validate.js";
import { promotionController } from "../../promotions-container.js";
import { createPromotionSchema, updatePromotionSchema } from "../validators/promotion-validator.js";

export const createPromotionRouter = (
    authenticationMiddleware: RequestHandler
): Router => {
    const router = Router();

    router.use(authenticationMiddleware);
    router.use(authorize("promotions:manage"));

    router.post(
        "/",
        validate(createPromotionSchema),
        asyncHandler(promotionController.create)
    );

    router.get(
        "/",
        asyncHandler(promotionController.list)
    );

    router.get(
        "/:id",
        asyncHandler(promotionController.get)
    );

    router.patch(
        "/:id",
        validate(updatePromotionSchema),
        asyncHandler(promotionController.update)
    );

    router.delete(
        "/:id",
        asyncHandler(promotionController.deactivate)
    );

    return router;
};

export const promotionRouter =
    createPromotionRouter(authenticate);