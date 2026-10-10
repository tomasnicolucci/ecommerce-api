import {
  beforeEach,
  describe,
  expect,
  it
} from "vitest";
import { PostgresCheckoutRepository } from "../../../modules/orders/infrastructure/persistence/postgres/repositories/postgres-checkout-repository.js";
import type { CheckoutItemSnapshot } from "../../../modules/orders/domain/repositories/checkout-repository.js";
import { postgresPool } from "../../../shared/infrastructure/database/postgres.js";

describe("PostgresCheckoutRepository", () => {
  let repository: PostgresCheckoutRepository;

  let userId: string;
  let customerId: string;
  let cartId: string;

  const variantId = "507f1f77bcf86cd799439011";

  const items: CheckoutItemSnapshot[] = [
    {
      variantId,
      productId: "507f1f77bcf86cd799439012",
      productName: "Test Product",
      sku: "TEST-SKU",
      unitPrice: 100,
      currency: "USD",
      quantity: 2
    }
  ];

  beforeEach(async () => {
    repository = new PostgresCheckoutRepository();

    await postgresPool.query(
      "DELETE FROM promotion_redemptions"
    );

    await postgresPool.query(
      "DELETE FROM payments"
    );

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
          INSERT INTO users (auth_user_id)
          VALUES ($1)
          RETURNING id
        `,
        [
          `checkout-test-${Date.now()}-${Math.random()}`
        ]
      );

    userId = userResult.rows[0].id;

    const customerResult =
      await postgresPool.query<{ id: string }>(
        `
          INSERT INTO customers (
            user_id,
            first_name,
            last_name
          )
          VALUES ($1, $2, $3)
          RETURNING id
        `,
        [userId, "Checkout", "Test"]
      );

    customerId = customerResult.rows[0].id;

    const cartResult =
      await postgresPool.query<{ id: string }>(
        `
          INSERT INTO carts (
            customer_id,
            status
          )
          VALUES ($1, 'ACTIVE')
          RETURNING id
        `,
        [customerId]
      );

    cartId = cartResult.rows[0].id;

    await postgresPool.query(
      `
        INSERT INTO cart_items (
          cart_id,
          product_variant_id,
          quantity
        )
        VALUES ($1, $2, $3)
      `,
      [cartId, variantId, 2]
    );

    await postgresPool.query(
      `
        INSERT INTO inventory_items (
          variant_id,
          quantity,
          reserved_quantity
        )
        VALUES ($1, $2, $3)
      `,
      [variantId, 10, 0]
    );
  });

  it(
    "should create a pending order, pending payment and reserve stock atomically",
    async () => {
      const result = await repository.checkout(
        customerId,
        cartId,
        items
      );

      expect(result.order.status).toBe("PENDING");
      expect(result.order.totalAmount).toBe(200);
      expect(result.paymentId).toBeDefined();

      const paymentResult = await postgresPool.query(
        `
          SELECT status, amount, currency
          FROM payments
          WHERE id = $1
        `,
        [result.paymentId]
      );

      expect(paymentResult.rows[0].status).toBe("PENDING");
      expect(
        Number(paymentResult.rows[0].amount)
      ).toBe(200);
      expect(paymentResult.rows[0].currency).toBe("USD");

      const inventoryResult = await postgresPool.query(
        `
          SELECT quantity, reserved_quantity
          FROM inventory_items
          WHERE variant_id = $1
        `,
        [variantId]
      );

      expect(inventoryResult.rows[0].quantity).toBe(10);
      expect(
        inventoryResult.rows[0].reserved_quantity
      ).toBe(2);

      const oldCartResult = await postgresPool.query(
        `
          SELECT status
          FROM carts
          WHERE id = $1
        `,
        [cartId]
      );

      expect(oldCartResult.rows[0].status).toBe("COMPLETED");

      const activeCartResult = await postgresPool.query(
        `
          SELECT id
          FROM carts
          WHERE customer_id = $1
            AND status = 'ACTIVE'
        `,
        [customerId]
      );

      expect(activeCartResult.rows).toHaveLength(1);
    }
  );

  it(
    "should rollback checkout when available stock is insufficient",
    async () => {
      await postgresPool.query(
        `
          UPDATE inventory_items
          SET reserved_quantity = 9
          WHERE variant_id = $1
        `,
        [variantId]
      );

      await expect(
        repository.checkout(
          customerId,
          cartId,
          items
        )
      ).rejects.toThrow("Insufficient stock");

      const orderResult = await postgresPool.query(
        "SELECT id FROM orders"
      );

      const paymentResult = await postgresPool.query(
        "SELECT id FROM payments"
      );

      expect(orderResult.rows).toHaveLength(0);
      expect(paymentResult.rows).toHaveLength(0);

      const inventoryResult = await postgresPool.query(
        `
          SELECT quantity, reserved_quantity
          FROM inventory_items
          WHERE variant_id = $1
        `,
        [variantId]
      );

      expect(inventoryResult.rows[0].quantity).toBe(10);
      expect(
        inventoryResult.rows[0].reserved_quantity
      ).toBe(9);

      const cartResult = await postgresPool.query(
        `
          SELECT status
          FROM carts
          WHERE id = $1
        `,
        [cartId]
      );

      expect(cartResult.rows[0].status).toBe("ACTIVE");
    }
  );

  it(
    "should rollback when cart changed during checkout",
    async () => {
      await postgresPool.query(
        `
          UPDATE cart_items
          SET quantity = 3
          WHERE cart_id = $1
        `,
        [cartId]
      );

      await expect(
        repository.checkout(
          customerId,
          cartId,
          items
        )
      ).rejects.toThrow(
        "Cart changed during checkout"
      );

      const inventoryResult = await postgresPool.query(
        `
          SELECT quantity, reserved_quantity
          FROM inventory_items
          WHERE variant_id = $1
        `,
        [variantId]
      );

      expect(inventoryResult.rows[0].quantity).toBe(10);
      expect(
        inventoryResult.rows[0].reserved_quantity
      ).toBe(0);

      const orderResult = await postgresPool.query(
        "SELECT id FROM orders"
      );

      const paymentResult = await postgresPool.query(
        "SELECT id FROM payments"
      );

      expect(orderResult.rows).toHaveLength(0);
      expect(paymentResult.rows).toHaveLength(0);
    }
  );

  it(
    "should prevent concurrent checkouts from reserving the same last stock",
    async () => {
      await postgresPool.query(
        `
          UPDATE inventory_items
          SET quantity = 2,
              reserved_quantity = 0
          WHERE variant_id = $1
        `,
        [variantId]
      );

      const secondUser =
        await postgresPool.query<{ id: string }>(
          `
            INSERT INTO users (auth_user_id)
            VALUES ($1)
            RETURNING id
          `,
          [
            `checkout-second-${Date.now()}-${Math.random()}`
          ]
        );

      const secondCustomer =
        await postgresPool.query<{ id: string }>(
          `
            INSERT INTO customers (
              user_id,
              first_name,
              last_name
            )
            VALUES ($1, $2, $3)
            RETURNING id
          `,
          [
            secondUser.rows[0].id,
            "Second",
            "Customer"
          ]
        );

      const secondCart =
        await postgresPool.query<{ id: string }>(
          `
            INSERT INTO carts (
              customer_id,
              status
            )
            VALUES ($1, 'ACTIVE')
            RETURNING id
          `,
          [secondCustomer.rows[0].id]
        );

      await postgresPool.query(
        `
          INSERT INTO cart_items (
            cart_id,
            product_variant_id,
            quantity
          )
          VALUES ($1, $2, $3)
        `,
        [
          secondCart.rows[0].id,
          variantId,
          2
        ]
      );

      const results = await Promise.allSettled([
        repository.checkout(
          customerId,
          cartId,
          items
        ),
        repository.checkout(
          secondCustomer.rows[0].id,
          secondCart.rows[0].id,
          items
        )
      ]);

      const fulfilled = results.filter(
        (result) => result.status === "fulfilled"
      );

      const rejected = results.filter(
        (result) => result.status === "rejected"
      );

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const inventoryResult = await postgresPool.query(
        `
          SELECT quantity, reserved_quantity
          FROM inventory_items
          WHERE variant_id = $1
        `,
        [variantId]
      );

      expect(inventoryResult.rows[0].quantity).toBe(2);
      expect(
        inventoryResult.rows[0].reserved_quantity
      ).toBe(2);

      const ordersResult = await postgresPool.query(
        "SELECT id FROM orders"
      );

      const paymentsResult = await postgresPool.query(
        "SELECT id FROM payments"
      );

      expect(ordersResult.rows).toHaveLength(1);
      expect(paymentsResult.rows).toHaveLength(1);
    }
  );
});