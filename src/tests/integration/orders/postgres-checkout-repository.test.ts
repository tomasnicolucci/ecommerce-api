import {
  beforeEach,
  describe,
  expect,
  it
} from "vitest";
import { postgresPool } from "../../../shared/infrastructure/database/postgres.js";
import { PostgresCheckoutRepository } from "../../../modules/orders/infrastructure/persistence/postgres/repositories/postgres-checkout-repository.js";
import type { CheckoutItemSnapshot } from "../../../modules/orders/domain/repositories/checkout-repository.js";

describe("PostgresCheckoutRepository", () => {
  const repository =
    new PostgresCheckoutRepository();

  let customerId: string;
  let cartId: string;

  const variantId = "checkout-variant-1";

  const createSnapshot = (
    quantity: number
  ): CheckoutItemSnapshot => ({
    variantId,
    productId: "checkout-product-1",
    productName: "Checkout Product",
    sku: "CHECKOUT-SKU-001",
    unitPrice: 100,
    currency: "USD",
    quantity
  });

  beforeEach(async () => {
    await postgresPool.query(
      "DELETE FROM order_items"
    );

    await postgresPool.query(
      "DELETE FROM orders"
    );

    await postgresPool.query(
      "DELETE FROM cart_items"
    );

    await postgresPool.query(
      "DELETE FROM carts"
    );

    await postgresPool.query(
      "DELETE FROM customers"
    );

    await postgresPool.query(
      "DELETE FROM inventory_items"
    );

    await postgresPool.query(
      "DELETE FROM user_roles"
    );

    await postgresPool.query(
      "DELETE FROM users"
    );

    const userResult =
      await postgresPool.query<{ id: string }>(
        `
          INSERT INTO users (
            auth_user_id
          )
          VALUES ($1)
          RETURNING id
        `,
        [
          `checkout-auth-${Date.now()}-${Math.random()}`
        ]
      );

    const customerResult =
      await postgresPool.query<{ id: string }>(
        `
          INSERT INTO customers (
            user_id,
            first_name,
            last_name
          )
          VALUES (
            $1,
            'Checkout',
            'Customer'
          )
          RETURNING id
        `,
        [userResult.rows[0].id]
      );

    customerId =
      customerResult.rows[0].id;

    const cartResult =
      await postgresPool.query<{ id: string }>(
        `
          INSERT INTO carts (
            customer_id,
            status
          )
          VALUES (
            $1,
            'ACTIVE'
          )
          RETURNING id
        `,
        [customerId]
      );

    cartId =
      cartResult.rows[0].id;

    await postgresPool.query(
      `
        INSERT INTO cart_items (
          cart_id,
          product_variant_id,
          quantity
        )
        VALUES (
          $1,
          $2,
          2
        )
      `,
      [
        cartId,
        variantId
      ]
    );

    await postgresPool.query(
      `
        INSERT INTO inventory_items (
          variant_id,
          quantity
        )
        VALUES (
          $1,
          10
        )
      `,
      [variantId]
    );
  });

  it("should complete checkout atomically", async () => {
    const order =
      await repository.checkout(
        customerId,
        cartId,
        [
          createSnapshot(2)
        ]
      );

    expect(order.id).toBeDefined();
    expect(order.customerId)
      .toBe(customerId);
    expect(order.cartId)
      .toBe(cartId);
    expect(order.status)
      .toBe("CONFIRMED");
    expect(order.totalAmount)
      .toBe(200);
    expect(order.currency)
      .toBe("USD");

    expect(order.items)
      .toHaveLength(1);

    expect(order.items[0].productName)
      .toBe("Checkout Product");

    expect(order.items[0].sku)
      .toBe("CHECKOUT-SKU-001");

    expect(order.items[0].unitPrice)
      .toBe(100);

    expect(order.items[0].quantity)
      .toBe(2);

    const inventoryResult =
      await postgresPool.query<{
        quantity: number;
      }>(
        `
          SELECT quantity
          FROM inventory_items
          WHERE variant_id = $1
        `,
        [variantId]
      );

    expect(
      inventoryResult.rows[0].quantity
    ).toBe(8);

    const completedCart =
      await postgresPool.query<{
        status: string;
        completed_at: Date | null;
      }>(
        `
          SELECT
            status,
            completed_at
          FROM carts
          WHERE id = $1
        `,
        [cartId]
      );

    expect(
      completedCart.rows[0].status
    ).toBe("COMPLETED");

    expect(
      completedCart.rows[0].completed_at
    ).not.toBeNull();

    const activeCart =
      await postgresPool.query<{
        id: string;
      }>(
        `
          SELECT id
          FROM carts
          WHERE customer_id = $1
            AND status = 'ACTIVE'
        `,
        [customerId]
      );

    expect(activeCart.rows)
      .toHaveLength(1);

    expect(activeCart.rows[0].id)
      .not.toBe(cartId);

    const orderResult =
      await postgresPool.query(
        `
          SELECT *
          FROM orders
          WHERE id = $1
        `,
        [order.id]
      );

    expect(orderResult.rows)
      .toHaveLength(1);

    const orderItemsResult =
      await postgresPool.query(
        `
          SELECT *
          FROM order_items
          WHERE order_id = $1
        `,
        [order.id]
      );

    expect(orderItemsResult.rows)
      .toHaveLength(1);
  });

  it("should rollback checkout when stock is insufficient", async () => {
    await postgresPool.query(
      `
        UPDATE inventory_items
        SET quantity = 1
        WHERE variant_id = $1
      `,
      [variantId]
    );

    await expect(
      repository.checkout(
        customerId,
        cartId,
        [
          createSnapshot(2)
        ]
      )
    ).rejects.toMatchObject({
      message: "Insufficient stock",
      statusCode: 409
    });

    const inventoryResult =
      await postgresPool.query<{
        quantity: number;
      }>(
        `
          SELECT quantity
          FROM inventory_items
          WHERE variant_id = $1
        `,
        [variantId]
      );

    expect(
      inventoryResult.rows[0].quantity
    ).toBe(1);

    const cartResult =
      await postgresPool.query<{
        status: string;
      }>(
        `
          SELECT status
          FROM carts
          WHERE id = $1
        `,
        [cartId]
      );

    expect(
      cartResult.rows[0].status
    ).toBe("ACTIVE");

    const orderResult =
      await postgresPool.query(
        `
          SELECT id
          FROM orders
          WHERE cart_id = $1
        `,
        [cartId]
      );

    expect(orderResult.rows)
      .toHaveLength(0);

    const activeCarts =
      await postgresPool.query(
        `
          SELECT id
          FROM carts
          WHERE customer_id = $1
            AND status = 'ACTIVE'
        `,
        [customerId]
      );

    expect(activeCarts.rows)
      .toHaveLength(1);
  });

  it("should rollback checkout when cart changed", async () => {
    await expect(
      repository.checkout(
        customerId,
        cartId,
        [
          createSnapshot(1)
        ]
      )
    ).rejects.toMatchObject({
      message:
        "Cart changed during checkout",
      statusCode: 409
    });

    const inventoryResult =
      await postgresPool.query<{
        quantity: number;
      }>(
        `
          SELECT quantity
          FROM inventory_items
          WHERE variant_id = $1
        `,
        [variantId]
      );

    expect(
      inventoryResult.rows[0].quantity
    ).toBe(10);

    const cartResult =
      await postgresPool.query<{
        status: string;
      }>(
        `
          SELECT status
          FROM carts
          WHERE id = $1
        `,
        [cartId]
      );

    expect(
      cartResult.rows[0].status
    ).toBe("ACTIVE");

    const orders =
      await postgresPool.query(
        `
          SELECT id
          FROM orders
          WHERE cart_id = $1
        `,
        [cartId]
      );

    expect(orders.rows)
      .toHaveLength(0);
  });

  it("should prevent two concurrent checkouts from consuming the same stock", async () => {
    await postgresPool.query(
      `
        UPDATE cart_items
        SET quantity = 1
        WHERE cart_id = $1
      `,
      [cartId]
    );

    await postgresPool.query(
      `
        UPDATE inventory_items
        SET quantity = 1
        WHERE variant_id = $1
      `,
      [variantId]
    );

    const secondUserResult =
      await postgresPool.query<{
        id: string;
      }>(
        `
          INSERT INTO users (
            auth_user_id
          )
          VALUES ($1)
          RETURNING id
        `,
        [
          `checkout-auth-second-${Date.now()}-${Math.random()}`
        ]
      );

    const secondCustomerResult =
      await postgresPool.query<{
        id: string;
      }>(
        `
          INSERT INTO customers (
            user_id,
            first_name,
            last_name
          )
          VALUES (
            $1,
            'Second',
            'Customer'
          )
          RETURNING id
        `,
        [secondUserResult.rows[0].id]
      );

    const secondCustomerId =
      secondCustomerResult.rows[0].id;

    const secondCartResult =
      await postgresPool.query<{
        id: string;
      }>(
        `
          INSERT INTO carts (
            customer_id,
            status
          )
          VALUES (
            $1,
            'ACTIVE'
          )
          RETURNING id
        `,
        [secondCustomerId]
      );

    const secondCartId =
      secondCartResult.rows[0].id;

    await postgresPool.query(
      `
        INSERT INTO cart_items (
          cart_id,
          product_variant_id,
          quantity
        )
        VALUES (
          $1,
          $2,
          1
        )
      `,
      [
        secondCartId,
        variantId
      ]
    );

    const results =
      await Promise.allSettled([
        repository.checkout(
          customerId,
          cartId,
          [
            createSnapshot(1)
          ]
        ),

        repository.checkout(
          secondCustomerId,
          secondCartId,
          [
            createSnapshot(1)
          ]
        )
      ]);

    const fulfilled =
      results.filter(
        (result) =>
          result.status === "fulfilled"
      );

    const rejected =
      results.filter(
        (result) =>
          result.status === "rejected"
      );

    expect(fulfilled)
      .toHaveLength(1);

    expect(rejected)
      .toHaveLength(1);

    if (
      rejected[0].status === "rejected"
    ) {
      expect(
        rejected[0].reason
      ).toMatchObject({
        message:
          "Insufficient stock",
        statusCode: 409
      });
    }

    const inventoryResult =
      await postgresPool.query<{
        quantity: number;
      }>(
        `
          SELECT quantity
          FROM inventory_items
          WHERE variant_id = $1
        `,
        [variantId]
      );

    expect(
      inventoryResult.rows[0].quantity
    ).toBe(0);

    const ordersResult =
      await postgresPool.query(
        `
          SELECT id
          FROM orders
        `
      );

    expect(ordersResult.rows)
      .toHaveLength(1);

    const activeCartsResult =
      await postgresPool.query<{
        customer_id: string;
      }>(
        `
          SELECT customer_id
          FROM carts
          WHERE status = 'ACTIVE'
        `
      );

    expect(activeCartsResult.rows)
      .toHaveLength(2);
  });
});