import type { Order } from "../entities/order.js";

export interface OrderRepository {
  findByCustomerId(
    customerId: string
  ): Promise<Order[]>;

  findByIdAndCustomerId(
    orderId: string,
    customerId: string
  ): Promise<Order | null>;
}