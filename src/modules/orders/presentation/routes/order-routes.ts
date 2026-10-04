import {
    Router,
    type RequestHandler
} from "express";
import { asyncHandler } from "../../../../shared/presentation/middlewares/async-handler.js";
import { authenticate } from "../../../auth/auth-container.js";
import { orderController } from "../../orders-container.js";

export const createOrderRouter = (
    authenticationMiddleware: RequestHandler
): Router => {
    const router = Router();

    router.use(
        authenticationMiddleware
    );

    router.post(
        "/checkout",
        asyncHandler(
            orderController.checkout
        )
    );

    router.get(
        "/me",
        asyncHandler(
            orderController.getMine
        )
    );

    router.get(
        "/me/:id",
        asyncHandler(
            orderController.getMineById
        )
    );

    return router;
};

export const orderRouter =
    createOrderRouter(authenticate);