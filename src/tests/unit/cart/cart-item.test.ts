import { describe, expect, it } from "vitest";
import { CartItem } from "../../../modules/cart/domain/entities/cart-item.js";

describe("CartItem", () => {
  it("should create a cart item", () => {
    const item = CartItem.create({
      cartId: "cart-1",
      variantId: "variant-1",
      quantity: 2
    });

    expect(item.id).toBeNull();
    expect(item.cartId).toBe("cart-1");
    expect(item.variantId).toBe("variant-1");
    expect(item.quantity).toBe(2);
  });

  it("should change quantity", () => {
    const item = CartItem.create({
      cartId: "cart-1",
      variantId: "variant-1",
      quantity: 2
    });

    item.changeQuantity(5);

    expect(item.quantity).toBe(5);
  });

  it("should reject zero quantity", () => {
    expect(() =>
      CartItem.create({
        cartId: "cart-1",
        variantId: "variant-1",
        quantity: 0
      })
    ).toThrow(
      "Cart item quantity must be a positive integer"
    );
  });

  it("should reject negative quantity", () => {
    expect(() =>
      CartItem.create({
        cartId: "cart-1",
        variantId: "variant-1",
        quantity: -1
      })
    ).toThrow(
      "Cart item quantity must be a positive integer"
    );
  });
});