import type { Payment } from "../../domain/entities/payment.js";

export class PaymentResponseMapper {
    static toResponse(
        payment: Payment
    ) {
        return {
            id: payment.id,
            orderId: payment.orderId,
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
            createdAt: payment.createdAt,
            resolvedAt: payment.resolvedAt
        };
    }
}