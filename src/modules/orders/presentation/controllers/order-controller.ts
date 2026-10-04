import type {
    Request,
    Response
} from "express";
import { AppError } from "../../../../shared/domain/errors/app-error.js";
import type { Checkout } from "../../application/use-cases/checkout.js";
import type { GetMyOrders } from "../../application/use-cases/get-my-orders.js";
import type { GetMyOrderById } from "../../application/use-cases/get-my-order-by-id.js";
import { OrderResponseMapper } from "../mappers/order-response-mapper.js";

export class OrderController {
    constructor(
        private readonly checkoutUseCase:
            Checkout,
        private readonly getMyOrders:
            GetMyOrders,
        private readonly getMyOrderById:
            GetMyOrderById
    ) { }

    checkout = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const userId =
            this.getAuthenticatedUserId(req);

        const order =
            await this.checkoutUseCase.execute(
                userId
            );

        res.status(201).json(
            OrderResponseMapper.toResponse(
                order
            )
        );
    };

    getMine = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const userId =
            this.getAuthenticatedUserId(req);

        const orders =
            await this.getMyOrders.execute(
                userId
            );

        res.status(200).json(
            orders.map((order) =>
                OrderResponseMapper.toResponse(
                    order
                )
            )
        );
    };

    getMineById = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const userId =
            this.getAuthenticatedUserId(req);

        const orderId =
            req.params.id;

        if (typeof orderId !== "string") {
            throw new AppError(
                "Invalid order id",
                400
            );
        }

        const order =
            await this.getMyOrderById.execute(
                userId,
                orderId
            );

        res.status(200).json(
            OrderResponseMapper.toResponse(
                order
            )
        );
    };

    private getAuthenticatedUserId(
        req: Request
    ): string {
        if (!req.auth) {
            throw new AppError(
                "Unauthorized",
                401
            );
        }

        return req.auth.userId;
    }
}