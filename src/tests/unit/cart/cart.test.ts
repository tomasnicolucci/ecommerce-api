import { describe, expect, it } from "vitest";
import { Cart } from "../../../modules/cart/domain/entities/cart.js";

describe("Cart", () => {
  it("should create an active empty cart", () => {
    const cart = Cart.create("customer-1");

    expect(cart.id).toBeNull();
    expect(cart.customerId).toBe("customer-1");
    expect(cart.status).toBe("ACTIVE");
    expect(cart.isActive).toBe(true);
    expect(cart.items).toEqual([]);
  });

  it("should reject an empty customer id", () => {
    expect(() => Cart.create("")).toThrow(
      "Customer id is required"
    );
  });
});