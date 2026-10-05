import { beforeEach, describe, expect, it } from "vitest";
import { CreateInventoryItem } from "../../../modules/inventory/application/use-cases/inventory/create-inventory-item.js";
import { Product } from "../../../modules/catalog/domain/entities/product.js";
import { ProductVariant } from "../../../modules/catalog/domain/entities/product-variant.js";
import { Money } from "../../../modules/catalog/domain/value-objects/money.js";
import { InMemoryInventoryRepository } from "../../helpers/in-memory-inventory-repository.js";
import { InMemoryProductRepository } from "../../helpers/in-memory-product-repository.js";

describe("CreateInventoryItem", () => {
  let inventoryRepository: InMemoryInventoryRepository;
  let productRepository: InMemoryProductRepository;
  let createInventoryItem: CreateInventoryItem;
  let variantId: string;

  beforeEach(() => {
    inventoryRepository = new InMemoryInventoryRepository();
    productRepository = new InMemoryProductRepository();

    createInventoryItem = new CreateInventoryItem(
      inventoryRepository,
      productRepository
    );

    variantId = "variant-1";

    const variant = ProductVariant.restore(
      variantId,
      {
        sku: "SKU-001",
        attributes: {},
        price: Money.create(100, "USD"),
        active: true
      }
    );

    const product = Product.restore(
      "product-1",
      {
        name: "Product",
        slug: "product",
        description: "Product",
        categoryId: "category-1",
        attributes: {},
        hasVariants: false,
        variants: [variant],
        active: true
      }
    );

    productRepository.products.push(product);
  });

  it("should create inventory for a product variant", async () => {
    const inventoryItem =
      await createInventoryItem.execute({
        variantId,
        quantity: 10
      });

    expect(inventoryItem.id).toBeDefined();
    expect(inventoryItem.variantId).toBe(variantId);
    expect(inventoryItem.quantity).toBe(10);
    expect(inventoryRepository.inventoryItems).toHaveLength(1);
    expect(inventoryItem.reservedQuantity).toBe(0);
    expect(inventoryItem.availableQuantity).toBe(10);
  });

  it("should not create inventory for a non-existing variant", async () => {
    await expect(
      createInventoryItem.execute({
        variantId: "non-existing-variant",
        quantity: 10
      })
    ).rejects.toThrow("Product variant not found");
  });

  it("should not create duplicate inventory for a variant", async () => {
    await createInventoryItem.execute({
      variantId,
      quantity: 10
    });

    await expect(
      createInventoryItem.execute({
        variantId,
        quantity: 20
      })
    ).rejects.toThrow(
      "Inventory already exists for this variant"
    );
  });
});