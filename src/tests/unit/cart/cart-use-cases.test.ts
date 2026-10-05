import { beforeEach, describe, expect, it } from "vitest";
import { AddCartItem } from "../../../modules/cart/application/use-cases/cart/add-cart-item.js";
import { GetActiveCart } from "../../../modules/cart/application/use-cases/cart/get-active-cart.js";
import { RemoveCartItem } from "../../../modules/cart/application/use-cases/cart/remove-cart-item.js";
import { UpdateCartItemQuantity } from "../../../modules/cart/application/use-cases/cart/update-cart-item-quantity.js";
import { Product } from "../../../modules/catalog/domain/entities/product.js";
import { ProductVariant } from "../../../modules/catalog/domain/entities/product-variant.js";
import { Money } from "../../../modules/catalog/domain/value-objects/money.js";
import { InventoryItem } from "../../../modules/inventory/domain/entities/inventory-item.js";
import { InMemoryCartRepository } from "../../helpers/in-memory-cart-repository.js";
import { InMemoryInventoryRepository } from "../../helpers/in-memory-inventory-repository.js";
import { InMemoryProductRepository } from "../../helpers/in-memory-product-repository.js";

describe("Cart use cases", () => {
  let cartRepository: InMemoryCartRepository;
  let productRepository: InMemoryProductRepository;
  let inventoryRepository: InMemoryInventoryRepository;

  const customerId = "customer-1";
  const variantId = "variant-1";

  beforeEach(() => {
    cartRepository = new InMemoryCartRepository();
    productRepository = new InMemoryProductRepository();
    inventoryRepository =
      new InMemoryInventoryRepository();

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

    inventoryRepository.inventoryItems.push(
      InventoryItem.restore("inventory-1", {
        variantId,
        quantity: 10,
        reservedQuantity: 0
      })
    );
  });

  it("should create an active cart when none exists", async () => {
    const useCase =
      new GetActiveCart(cartRepository);

    const cart =
      await useCase.execute(customerId);

    expect(cart.id).toBeDefined();
    expect(cart.customerId).toBe(customerId);
    expect(cart.status).toBe("ACTIVE");
  });

  it("should return the existing active cart", async () => {
    const useCase =
      new GetActiveCart(cartRepository);

    const first =
      await useCase.execute(customerId);

    const second =
      await useCase.execute(customerId);

    expect(second.id).toBe(first.id);
    expect(cartRepository.carts).toHaveLength(1);
  });

  it("should add an item to the cart", async () => {
    const useCase = new AddCartItem(
      cartRepository,
      productRepository,
      inventoryRepository
    );

    const cart = await useCase.execute({
      customerId,
      variantId,
      quantity: 2
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.variantId).toBe(variantId);
    expect(cart.items[0]?.quantity).toBe(2);
  });

  it("should add quantity when the variant is already in the cart", async () => {
    const useCase = new AddCartItem(
      cartRepository,
      productRepository,
      inventoryRepository
    );

    await useCase.execute({
      customerId,
      variantId,
      quantity: 2
    });

    const cart = await useCase.execute({
      customerId,
      variantId,
      quantity: 3
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.quantity).toBe(5);
  });

  it("should reject quantity greater than available stock", async () => {
    const useCase = new AddCartItem(
      cartRepository,
      productRepository,
      inventoryRepository
    );

    inventoryRepository.inventoryItems[0] =
      InventoryItem.restore("inventory-1", {
        variantId,
        quantity: 10,
        reservedQuantity: 4
      });

    await expect(
      useCase.execute({
        customerId,
        variantId,
        quantity: 7
      })
    ).rejects.toThrow("Insufficient stock");
  });

  it("should allow quantity equal to available stock", async () => {
    const useCase = new AddCartItem(
      cartRepository,
      productRepository,
      inventoryRepository
    );

    inventoryRepository.inventoryItems[0] =
      InventoryItem.restore("inventory-1", {
        variantId,
        quantity: 10,
        reservedQuantity: 4
      });

    const cart = await useCase.execute({
      customerId,
      variantId,
      quantity: 6
    });

    expect(cart.items[0]?.quantity).toBe(6);
  });

  it("should consider existing cart quantity when checking available stock", async () => {
    const useCase = new AddCartItem(
      cartRepository,
      productRepository,
      inventoryRepository
    );

    inventoryRepository.inventoryItems[0] =
      InventoryItem.restore("inventory-1", {
        variantId,
        quantity: 10,
        reservedQuantity: 4
      });

    await useCase.execute({
      customerId,
      variantId,
      quantity: 4
    });

    await expect(
      useCase.execute({
        customerId,
        variantId,
        quantity: 3
      })
    ).rejects.toThrow("Insufficient stock");
  });

  it("should update item quantity", async () => {
    const addCartItem = new AddCartItem(
      cartRepository,
      productRepository,
      inventoryRepository
    );

    await addCartItem.execute({
      customerId,
      variantId,
      quantity: 2
    });

    const updateQuantity =
      new UpdateCartItemQuantity(
        cartRepository,
        inventoryRepository
      );

    const cart = await updateQuantity.execute({
      customerId,
      variantId,
      quantity: 6
    });

    expect(cart.items[0]?.quantity).toBe(6);
  });

  it("should reject an update greater than available stock", async () => {
    const addCartItem = new AddCartItem(
      cartRepository,
      productRepository,
      inventoryRepository
    );

    await addCartItem.execute({
      customerId,
      variantId,
      quantity: 2
    });

    inventoryRepository.inventoryItems[0] =
      InventoryItem.restore("inventory-1", {
        variantId,
        quantity: 10,
        reservedQuantity: 4
      });

    const updateQuantity =
      new UpdateCartItemQuantity(
        cartRepository,
        inventoryRepository
      );

    await expect(
      updateQuantity.execute({
        customerId,
        variantId,
        quantity: 7
      })
    ).rejects.toThrow("Insufficient stock");
  });

  it("should update quantity up to available stock", async () => {
    const addCartItem = new AddCartItem(
      cartRepository,
      productRepository,
      inventoryRepository
    );

    await addCartItem.execute({
      customerId,
      variantId,
      quantity: 2
    });

    inventoryRepository.inventoryItems[0] =
      InventoryItem.restore("inventory-1", {
        variantId,
        quantity: 10,
        reservedQuantity: 4
      });

    const updateQuantity =
      new UpdateCartItemQuantity(
        cartRepository,
        inventoryRepository
      );

    const cart = await updateQuantity.execute({
      customerId,
      variantId,
      quantity: 6
    });

    expect(cart.items[0]?.quantity).toBe(6);
  });

  it("should remove an item", async () => {
    const addCartItem = new AddCartItem(
      cartRepository,
      productRepository,
      inventoryRepository
    );

    await addCartItem.execute({
      customerId,
      variantId,
      quantity: 2
    });

    const removeCartItem =
      new RemoveCartItem(cartRepository);

    const cart = await removeCartItem.execute({
      customerId,
      variantId
    });

    expect(cart.items).toHaveLength(0);
  });
});