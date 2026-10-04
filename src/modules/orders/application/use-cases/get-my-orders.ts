import { AppError } from "../../../../shared/domain/errors/app-error.js";
import type { CustomerRepository } from "../../../customers/domain/repositories/customer-repository.js";
import type { Order } from "../../domain/entities/order.js";
import type { OrderRepository } from "../../domain/repositories/order-repository.js";

export class GetMyOrders {
  constructor(
    private readonly customerRepository:
      CustomerRepository,
    private readonly orderRepository:
      OrderRepository
  ) {}

  async execute(
    userId: string
  ): Promise<Order[]> {
    const customer =
      await this.customerRepository.findByUserId(
        userId
      );

    if (!customer || !customer.id) {
      throw new AppError(
        "Customer not found",
        404
      );
    }

    return this.orderRepository.findByCustomerId(
      customer.id
    );
  }
}