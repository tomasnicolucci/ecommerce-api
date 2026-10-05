import type {
    Request,
    Response
} from "express";
import { AppError } from "../../../../shared/domain/errors/app-error.js";
import type { ApprovePayment } from "../../application/use-cases/payments/approve-payment.js";
import type { GetPaymentById } from "../../application/use-cases/payments/get-payment-by-id.js";
import type { RejectPayment } from "../../application/use-cases/payments/reject-payment.js";
import { PaymentResponseMapper } from "../mappers/payment-response-mapper.js";

export class PaymentController {
    constructor(
        private readonly getPaymentById:
            GetPaymentById,
        private readonly approvePayment:
            ApprovePayment,
        private readonly rejectPayment:
            RejectPayment
    ) { }

    getById = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const userId =
            this.getAuthenticatedUserId(req);

        const paymentId =
            this.getPaymentId(req);

        const payment =
            await this.getPaymentById.execute(
                paymentId,
                userId
            );

        res.status(200).json(
            PaymentResponseMapper.toResponse(
                payment
            )
        );
    };

    approve = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const userId =
            this.getAuthenticatedUserId(req);

        const paymentId =
            this.getPaymentId(req);

        const payment =
            await this.approvePayment.execute(
                paymentId,
                userId
            );

        res.status(200).json(
            PaymentResponseMapper.toResponse(
                payment
            )
        );
    };

    reject = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const userId =
            this.getAuthenticatedUserId(req);

        const paymentId =
            this.getPaymentId(req);

        const payment =
            await this.rejectPayment.execute(
                paymentId,
                userId
            );

        res.status(200).json(
            PaymentResponseMapper.toResponse(
                payment
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

    private getPaymentId(
        req: Request
    ): string {
        const id = req.params.id;

        if (typeof id !== "string") {
            throw new AppError(
                "Invalid payment id",
                400
            );
        }

        return id;
    }
}