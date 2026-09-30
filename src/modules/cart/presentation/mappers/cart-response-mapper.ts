import type { Cart } from "../../domain/entities/cart.js";

export class CartResponseMapper {
  static toResponse(cart: Cart) {
    return {
      id: cart.id,
      customerId: cart.customerId,
      status: cart.status,
      items: cart.items.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity
      }))
    };
  }
}