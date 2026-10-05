import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { PaymentRepository } from "../../../domain/repositories/payment-repository.js";

export class GetPaymentById {
    constructor(
        private readonly paymentRepository:
            PaymentRepository
    ) { }

    async execute(
        paymentId: string,
        userId: string
    ) {
        const payment =
            await this.paymentRepository.findById(
                paymentId,
                userId
            );

        if (!payment) {
            throw new AppError(
                "Payment not found",
                404
            );
        }

        return payment;
    }
}