import type { PaymentRepository } from "../../../domain/repositories/payment-repository.js";

export class ApprovePayment {
  constructor(
    private readonly paymentRepository:
      PaymentRepository
  ) {}

  async execute(
    paymentId: string,
    userId: string
  ) {
    return this.paymentRepository.approve(
      paymentId,
      userId
    );
  }
}