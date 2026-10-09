import { Cart } from "../../modules/cart/domain/entities/cart.js";
import { CartItem } from "../../modules/cart/domain/entities/cart-item.js";
import type { CartRepository } from "../../modules/cart/domain/repositories/cart-repository.js";

export class InMemoryCartRepository implements CartRepository {
  public carts: Cart[] = [];
  public items: CartItem[] = [];

  async findActiveByCustomerId(
    customerId: string
  ): Promise<Cart | null> {
    const cart = this.carts.find(
      (item) =>
        item.customerId === customerId &&
        item.status === "ACTIVE"
    );

    if (!cart || !cart.id) {
      return null;
    }

    const cartItems = this.items.filter(
      (item) => item.cartId === cart.id
    );

    return Cart.restore(cart.id, {
      customerId: cart.customerId,
      status: cart.status,
      items: cartItems,
      promotionCode: cart.promotionCode
    });
  }

  async save(cart: Cart): Promise<Cart> {
    const savedCart = Cart.restore(
      cart.id ?? `cart-${this.carts.length + 1}`,
      {
        customerId: cart.customerId,
        status: cart.status,
        items: [],
        promotionCode: cart.promotionCode
      }
    );

    this.carts.push(savedCart);

    return savedCart;
  }

  async findItemByVariantId(
    cartId: string,
    variantId: string
  ): Promise<CartItem | null> {
    return (
      this.items.find(
        (item) =>
          item.cartId === cartId &&
          item.variantId === variantId
      ) ?? null
    );
  }

  async addItem(cartItem: CartItem): Promise<CartItem> {
    const savedItem = CartItem.restore(
      cartItem.id ?? `cart-item-${this.items.length + 1}`,
      {
        cartId: cartItem.cartId,
        variantId: cartItem.variantId,
        quantity: cartItem.quantity
      }
    );

    this.items.push(savedItem);

    return savedItem;
  }

  async updateItem(cartItem: CartItem): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id === cartItem.id
    );

    if (index !== -1) {
      this.items[index] = cartItem;
    }
  }

  async removeItem(
    cartId: string,
    variantId: string
  ): Promise<void> {
    this.items = this.items.filter(
      (item) =>
        !(
          item.cartId === cartId &&
          item.variantId === variantId
        )
    );
  }

  async setPromotionCode(
    cartId: string,
    promotionCode: string | null
  ): Promise<void> {
    const index = this.carts.findIndex(
      (cart) => cart.id === cartId && cart.isActive
    );

    if (index === -1) {
      return;
    }

    const cart = this.carts[index];

    this.carts[index] = Cart.restore(cartId, {
      customerId: cart.customerId,
      status: cart.status,
      items: [],
      promotionCode
    });
  }
}