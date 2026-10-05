import type { Order } from "../entities/order.js";

export interface CheckoutItemSnapshot {
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  currency: string;
  quantity: number;
}

export interface CheckoutResult {
  order: Order;
  paymentId: string;
}

export interface CheckoutRepository {
  checkout(
    customerId: string,
    cartId: string,
    items: CheckoutItemSnapshot[]
  ): Promise<CheckoutResult>;
}