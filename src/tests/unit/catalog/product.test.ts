import { describe, expect, it } from "vitest";
import { Product } from "../../../modules/catalog/domain/entities/product.js";
import { ProductVariant } from "../../../modules/catalog/domain/entities/product-variant.js";
import { Money } from "../../../modules/catalog/domain/value-objects/money.js";

describe("Product", () => {
  it("should create a product", () => {
    const product = Product.create({
      name: "ThinkPad E14",
      slug: "thinkpad-e14",
      description: "Business laptop",
      categoryId: "category-1",
      attributes: {
        brand: "Lenovo",
        processor: "Ryzen 7"
      },
      variants: [],
      active: true
    });

    expect(product.id).toBeNull();
    expect(product.name).toBe("ThinkPad E14");
    expect(product.slug).toBe("thinkpad-e14");
    expect(product.categoryId).toBe("category-1");
    expect(product.attributes.brand).toBe("Lenovo");
    expect(product.active).toBe(true);
  });

  it("should not create a product without a name", () => {
    expect(() =>
      Product.create({
        name: "",
        slug: "thinkpad-e14",
        description: "",
        categoryId: "category-1",
        attributes: {},
        variants: [],
        active: true
      })
    ).toThrow("Product name is required");
  });

  it("should not create a product without a slug", () => {
    expect(() =>
      Product.create({
        name: "ThinkPad E14",
        slug: "",
        description: "",
        categoryId: "category-1",
        attributes: {},
        variants: [],
        active: true
      })
    ).toThrow("Product slug is required");
  });

  it("should not create a product without a category", () => {
    expect(() =>
      Product.create({
        name: "ThinkPad E14",
        slug: "thinkpad-e14",
        description: "",
        categoryId: "",
        attributes: {},
        variants: [],
        active: true
      })
    ).toThrow("Product category is required");
  });

  it("should add a variant", () => {
    const product = Product.create({
      name: "ThinkPad E14",
      slug: "thinkpad-e14",
      description: "",
      categoryId: "category-1",
      attributes: {},
      variants: [],
      active: true
    });

    const variant = ProductVariant.create({
      sku: "LEN-E14-16-512",
      attributes: {
        ram: "16GB",
        storage: "512GB"
      },
      price: Money.create(1200, "USD"),
      active: true
    });

    product.addVariant(variant);

    expect(product.variants).toHaveLength(1);
    expect(product.variants[0]?.sku).toBe("LEN-E14-16-512");
  });

  it("should not allow duplicate variant SKUs", () => {
    const firstVariant = ProductVariant.create({
      sku: "LEN-E14-16-512",
      attributes: {},
      price: Money.create(1200, "USD"),
      active: true
    });

    const product = Product.create({
      name: "ThinkPad E14",
      slug: "thinkpad-e14",
      description: "",
      categoryId: "category-1",
      attributes: {},
      variants: [firstVariant],
      active: true
    });

    const secondVariant = ProductVariant.create({
      sku: "LEN-E14-16-512",
      attributes: {},
      price: Money.create(1300, "USD"),
      active: true
    });

    expect(() =>
      product.addVariant(secondVariant)
    ).toThrow("Product variant SKU already exists");
  });

  it("should deactivate and activate a product", () => {
    const product = Product.create({
      name: "ThinkPad E14",
      slug: "thinkpad-e14",
      description: "",
      categoryId: "category-1",
      attributes: {},
      variants: [],
      active: true
    });

    product.deactivate();
    expect(product.active).toBe(false);

    product.activate();
    expect(product.active).toBe(true);
  });
});