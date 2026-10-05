import { Router, type RequestHandler } from "express";
import { authenticate } from "../../../auth/auth-container.js";
import { asyncHandler } from "../../../../shared/presentation/middlewares/async-handler.js";
import { paymentController } from "../../payments-container.js";

export const createPaymentRouter = (
    authenticationMiddleware:
        RequestHandler
): Router => {
    const router = Router();

    router.use(
        authenticationMiddleware
    );

    router.get(
        "/:id",
        asyncHandler(
            paymentController.getById
        )
    );

    router.post(
        "/:id/approve",
        asyncHandler(
            paymentController.approve
        )
    );

    router.post(
        "/:id/reject",
        asyncHandler(
            paymentController.reject
        )
    );

    return router;
};

export const paymentRouter = createPaymentRouter(authenticate);