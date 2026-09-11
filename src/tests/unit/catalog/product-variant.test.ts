import { describe, expect, it } from "vitest";
import { ProductVariant } from "../../../modules/catalog/domain/entities/product-variant.js";
import { Money } from "../../../modules/catalog/domain/value-objects/money.js";

describe("ProductVariant", () => {
  it("should create a product variant", () => {
    const variant = ProductVariant.create({
      sku: "LEN-E14-16-512",
      attributes: {
        ram: "16GB",
        storage: "512GB"
      },
      price: Money.create(1200, "USD"),
      active: true
    });

    expect(variant.id).toBeNull();
    expect(variant.sku).toBe("LEN-E14-16-512");
    expect(variant.attributes.ram).toBe("16GB");
    expect(variant.price.amount).toBe(1200);
    expect(variant.price.currency).toBe("USD");
    expect(variant.active).toBe(true);
  });

  it("should not create a variant without SKU", () => {
    expect(() =>
      ProductVariant.create({
        sku: "",
        attributes: {},
        price: Money.create(1200, "USD"),
        active: true
      })
    ).toThrow("Product variant SKU is required");
  });

  it("should change the price", () => {
    const variant = ProductVariant.create({
      sku: "LEN-E14-16-512",
      attributes: {},
      price: Money.create(1200, "USD"),
      active: true
    });

    variant.changePrice(Money.create(1300, "USD"));

    expect(variant.price.amount).toBe(1300);
  });

  it("should deactivate and activate a variant", () => {
    const variant = ProductVariant.create({
      sku: "LEN-E14-16-512",
      attributes: {},
      price: Money.create(1200, "USD"),
      active: true
    });

    variant.deactivate();
    expect(variant.active).toBe(false);

    variant.activate();
    expect(variant.active).toBe(true);
  });
});