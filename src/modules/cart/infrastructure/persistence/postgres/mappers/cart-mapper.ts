import { Cart } from "../../../../domain/entities/cart.js";
import { CartItem } from "../../../../domain/entities/cart-item.js";
import type { CartStatus } from "../../../../domain/entities/cart.js";

interface CartRow {
  id: string;
  customer_id: string;
  status: CartStatus;
  promotion_code?: string | null;
}

interface CartItemRow {
  id: string;
  cart_id: string;
  product_variant_id: string;
  quantity: number;
}

export class CartMapper {
  static toDomain(
    cartRow: CartRow,
    itemRows: CartItemRow[]
  ): Cart {
    const items = itemRows.map((row) =>
      CartItem.restore(row.id, {
        cartId: row.cart_id,
        variantId: row.product_variant_id,
        quantity: row.quantity
      })
    );

    return Cart.restore(cartRow.id, {
      customerId: cartRow.customer_id,
      status: cartRow.status,
      items,
      promotionCode: cartRow.promotion_code ?? null
    });
  }

  static itemToDomain(row: CartItemRow): CartItem {
    return CartItem.restore(row.id, {
      cartId: row.cart_id,
      variantId: row.product_variant_id,
      quantity: row.quantity
    });
  }
}