import type { Cart } from "../entities/cart.js";
import type { CartItem } from "../entities/cart-item.js";

export interface CartRepository {
  findActiveByCustomerId(
    customerId: string
  ): Promise<Cart | null>;

  save(cart: Cart): Promise<Cart>;

  findItemByVariantId(
    cartId: string,
    variantId: string
  ): Promise<CartItem | null>;

  addItem(
    cartItem: CartItem
  ): Promise<CartItem>;

  updateItem(
    cartItem: CartItem
  ): Promise<void>;

  removeItem(
    cartId: string,
    variantId: string
  ): Promise<void>;

  setPromotionCode(
    cartId: string,
    promotionCode: string | null
  ): Promise<void>;
}