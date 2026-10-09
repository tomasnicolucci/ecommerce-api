import type { CartPricing } from "../../application/services/cart-pricing-service.js";
import type { Cart } from "../../domain/entities/cart.js";

export class CartResponseMapper {
  static toResponse(
    cart: Cart,
    pricing?: CartPricing
  ) {
    return {
      id: cart.id,
      customerId: cart.customerId,
      status: cart.status,
      items: cart.items.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity
      })),
      promotionCode: pricing?.promotionCode ?? cart.promotionCode,
      subtotalAmount: pricing?.subtotalAmount ?? null,
      discountAmount: pricing?.discountAmount ?? null,
      totalAmount: pricing?.totalAmount ?? null,
      currency: pricing?.currency ?? null
    };
  }
}