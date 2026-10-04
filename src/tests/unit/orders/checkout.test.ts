import {
  describe,
  expect,
  it
} from "vitest";
import { Checkout } from "../../../modules/orders/application/use-cases/checkout.js";
import { Cart } from "../../../modules/cart/domain/entities/cart.js";
import { CartItem } from "../../../modules/cart/domain/entities/cart-item.js";
import { Customer } from "../../../modules/customers/domain/entities/customer.js";
import { Product } from "../../../modules/catalog/domain/entities/product.js";
import { ProductVariant } from "../../../modules/catalog/domain/entities/product-variant.js";
import { Money } from "../../../modules/catalog/domain/value-objects/money.js";
import { Order } from "../../../modules/orders/domain/entities/order.js";
import { OrderItem } from "../../../modules/orders/domain/entities/order-item.js";
import type { CartRepository } from "../../../modules/cart/domain/repositories/cart-repository.js";
import type { CustomerRepository } from "../../../modules/customers/domain/repositories/customer-repository.js";
import type { ProductRepository } from "../../../modules/catalog/domain/repositories/product-repository.js";
import type {
  CheckoutItemSnapshot,
  CheckoutRepository
} from "../../../modules/orders/domain/repositories/checkout-repository.js";

const customer =
  Customer.restore(
    "customer-1",
    {
      userId: "user-1",
      firstName: "Test",
      lastName: "Customer"
    }
  );

const cartItem =
  CartItem.restore(
    "item-1",
    {
      cartId: "cart-1",
      variantId: "variant-1",
      quantity: 2
    }
  );

const cart =
  Cart.restore(
    "cart-1",
    {
      customerId: "customer-1",
      status: "ACTIVE",
      items: [cartItem]
    }
  );

const variant =
  ProductVariant.restore(
    "variant-1",
    {
      sku: "SKU-001",
      attributes: {},
      price: Money.create(
        100,
        "USD"
      ),
      active: true
    }
  );

const product =
  Product.restore(
    "product-1",
    {
      name: "Test Product",
      slug: "test-product",
      description: "Test",
      categoryId: "category-1",
      attributes: {},
      hasVariants: false,
      variants: [variant],
      active: true
    }
  );

class FakeCustomerRepository
  implements CustomerRepository
{
  async findById() {
    return customer;
  }

  async findByUserId() {
    return customer;
  }

  async save() {
    return customer;
  }

  async update(): Promise<void> {}
}

class FakeCartRepository
  implements CartRepository
{
  async findActiveByCustomerId() {
    return cart;
  }

  async save() {
    return cart;
  }

  async findItemByVariantId() {
    return cartItem;
  }

  async addItem() {
    return cartItem;
  }

  async updateItem(): Promise<void> {}

  async removeItem(): Promise<void> {}
}

class FakeProductRepository
  implements ProductRepository
{
  async findById() {
    return product;
  }

  async findBySlug() {
    return product;
  }

  async findBySku() {
    return product;
  }

  async findByVariantId() {
    return product;
  }

  async findAll() {
    return [product];
  }

  async save() {
    return product;
  }

  async update(): Promise<void> {}

  async delete(): Promise<void> {}
}

class FakeCheckoutRepository
  implements CheckoutRepository
{
  public receivedItems:
    CheckoutItemSnapshot[] = [];

  async checkout(
    customerId: string,
    cartId: string,
    items: CheckoutItemSnapshot[]
  ): Promise<Order> {
    this.receivedItems = items;

    const orderItems =
      items.map((item) =>
        OrderItem.create({
          productId:
            item.productId,
          variantId:
            item.variantId,
          productName:
            item.productName,
          sku:
            item.sku,
          unitPrice:
            item.unitPrice,
          currency:
            item.currency,
          quantity:
            item.quantity
        })
      );

    return Order.create(
      customerId,
      cartId,
      orderItems
    );
  }
}

describe("Checkout", () => {
  it("should create checkout snapshots from the active cart", async () => {
    const checkoutRepository =
      new FakeCheckoutRepository();

    const checkout =
      new Checkout(
        new FakeCustomerRepository(),
        new FakeCartRepository(),
        new FakeProductRepository(),
        checkoutRepository
      );

    const order =
      await checkout.execute(
        "user-1"
      );

    expect(order.customerId)
      .toBe("customer-1");

    expect(order.cartId)
      .toBe("cart-1");

    expect(order.totalAmount)
      .toBe(200);

    expect(order.currency)
      .toBe("USD");

    expect(
      checkoutRepository.receivedItems
    ).toEqual([
      {
        variantId:
          "variant-1",
        productId:
          "product-1",
        productName:
          "Test Product",
        sku:
          "SKU-001",
        unitPrice:
          100,
        currency:
          "USD",
        quantity:
          2
      }
    ]);
  });
});