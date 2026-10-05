import type { Payment } from "../entities/payment.js";

export interface PaymentRepository {
    findById(
        id: string,
        userId: string
    ): Promise<Payment | null>;

    approve(
        id: string,
        userId: string
    ): Promise<Payment>;

    reject(
        id: string,
        userId: string
    ): Promise<Payment>;
}