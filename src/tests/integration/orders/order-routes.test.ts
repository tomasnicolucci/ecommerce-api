import express, {
  type RequestHandler
} from "express";
import request from "supertest";
import {
  beforeEach,
  describe,
  expect,
  it
} from "vitest";
import { createCartRouter } from "../../../modules/cart/presentation/routes/cart-routes.js";
import { createOrderRouter } from "../../../modules/orders/presentation/routes/order-routes.js";
import { postgresPool } from "../../../shared/infrastructure/database/postgres.js";
import { errorHandler } from "../../../shared/presentation/middlewares/error-handler.js";
import {
  createRbacTestApp,
  createTestUser
} from "../../helpers/rbac-test-app.js";

describe("Order routes", () => {
  let userId: string;
  let customerId: string;
  let variantId: string;

  const adminContext = createRbacTestApp();

  const fakeAuthenticate: RequestHandler = (
    req,
    _res,
    next
  ) => {
    req.auth = {
      userId,
      authUserId: "auth-order-test"
    };

    next();
  };

  const testApp = express();

  testApp.use(express.json());

  testApp.use(
    "/carts",
    createCartRouter(fakeAuthenticate)
  );

  testApp.use(
    "/orders",
    createOrderRouter(fakeAuthenticate)
  );

  testApp.use(errorHandler);

  beforeEach(async () => {
    await postgresPool.query(
      "DELETE FROM payments"
    );

    await postgresPool.query(
      "DELETE FROM order_items"
    );

    await postgresPool.query(
      "DELETE FROM promotion_redemptions"
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

    const adminId =
      await createTestUser("admin");

    adminContext.authenticateAs(adminId);

    const userResult =
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
          `auth-order-test-${Date.now()}-${Math.random()}`
        ]
      );

    userId = userResult.rows[0].id;

    const customerResult =
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
            $2,
            $3
          )
          RETURNING id
        `,
        [
          userId,
          "Order",
          "Customer"
        ]
      );

    customerId =
      customerResult.rows[0].id;

    const categoryResponse =
      await request(adminContext.app)
        .post("/categories")
        .send({
          name: "Order Test Category",
          slug: `order-test-${Date.now()}-${Math.random()}`,
          parentId: null,
          attributes: [
            {
              name: "brand",
              type: "string",
              scope: "product",
              required: true
            }
          ]
        });

    expect(categoryResponse.status)
      .toBe(201);

    const productResponse =
      await request(adminContext.app)
        .post("/products")
        .send({
          name: "Order Test Product",
          slug: `order-product-${Date.now()}-${Math.random()}`,
          description:
            "Product for order tests",
          categoryId:
            categoryResponse.body.id,
          attributes: {
            brand: "Test"
          },
          hasVariants: false,
          sku: `ORDER-SKU-${Date.now()}-${Math.random()}`,
          price: {
            amount: 100,
            currency: "USD"
          }
        });

    expect(productResponse.status)
      .toBe(201);

    variantId =
      productResponse.body.variants[0].id;

    const inventoryResponse =
      await request(adminContext.app)
        .post("/inventory")
        .send({
          variantId,
          quantity: 10
        });

    expect(inventoryResponse.status)
      .toBe(201);
  });

  it("should checkout the authenticated customer active cart", async () => {
    const addItemResponse =
      await request(testApp)
        .post("/carts/me/items")
        .send({
          variantId,
          quantity: 2
        });

    expect(addItemResponse.status)
      .toBe(200);

    const oldCartId =
      addItemResponse.body.id;

    const response =
      await request(testApp)
        .post("/orders/checkout");

    expect(response.status)
      .toBe(201);

    expect(response.body.order.id)
      .toBeDefined();

    expect(
      response.body.order.customerId
    ).toBe(customerId);

    expect(
      response.body.order.cartId
    ).toBe(oldCartId);

    expect(
      response.body.order.status
    ).toBe("PENDING");

    expect(
      response.body.order.totalAmount
    ).toBe(200);

    expect(
      response.body.order.currency
    ).toBe("USD");

    expect(
      response.body.order.items
    ).toHaveLength(1);

    expect(
      response.body.order.items[0]
        .variantId
    ).toBe(variantId);

    expect(
      response.body.order.items[0]
        .productName
    ).toBe("Order Test Product");

    expect(
      response.body.order.items[0]
        .unitPrice
    ).toBe(100);

    expect(
      response.body.order.items[0]
        .quantity
    ).toBe(2);

    expect(
      response.body.order.items[0]
        .subtotal
    ).toBe(200);

    expect(response.body.paymentId)
      .toBeDefined();

    const paymentResult =
      await postgresPool.query<{
        id: string;
        order_id: string;
        status: string;
        amount: string;
        currency: string;
      }>(
        `
          SELECT
            id,
            order_id,
            status,
            amount,
            currency
          FROM payments
          WHERE id = $1
        `,
        [response.body.paymentId]
      );

    expect(paymentResult.rows)
      .toHaveLength(1);

    expect(
      paymentResult.rows[0].order_id
    ).toBe(response.body.order.id);

    expect(
      paymentResult.rows[0].status
    ).toBe("PENDING");

    expect(
      Number(
        paymentResult.rows[0].amount
      )
    ).toBe(200);

    expect(
      paymentResult.rows[0].currency
    ).toBe("USD");

    const inventoryResult =
      await postgresPool.query<{
        quantity: number;
        reserved_quantity: number;
      }>(
        `
          SELECT
            quantity,
            reserved_quantity
          FROM inventory_items
          WHERE variant_id = $1
        `,
        [variantId]
      );

    expect(
      inventoryResult.rows[0].quantity
    ).toBe(10);

    expect(
      inventoryResult.rows[0]
        .reserved_quantity
    ).toBe(2);

    const completedCartResult =
      await postgresPool.query<{
        status: string;
      }>(
        `
          SELECT status
          FROM carts
          WHERE id = $1
        `,
        [oldCartId]
      );

    expect(
      completedCartResult.rows[0].status
    ).toBe("COMPLETED");

    const newActiveCartResult =
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

    expect(newActiveCartResult.rows)
      .toHaveLength(1);

    expect(
      newActiveCartResult.rows[0].id
    ).not.toBe(oldCartId);
  });

  it("should return the authenticated customer orders", async () => {
    await request(testApp)
      .post("/carts/me/items")
      .send({
        variantId,
        quantity: 2
      });

    const checkoutResponse =
      await request(testApp)
        .post("/orders/checkout");

    expect(checkoutResponse.status)
      .toBe(201);

    const response =
      await request(testApp)
        .get("/orders/me");

    expect(response.status)
      .toBe(200);

    expect(response.body)
      .toHaveLength(1);

    expect(response.body[0].id)
      .toBe(
        checkoutResponse.body.order.id
      );

    expect(response.body[0].customerId)
      .toBe(customerId);

    expect(response.body[0].status)
      .toBe("PENDING");

    expect(response.body[0].items)
      .toHaveLength(1);

    expect(
      response.body[0].items[0]
        .productName
    ).toBe("Order Test Product");
  });

  it("should return one order belonging to the authenticated customer", async () => {
    await request(testApp)
      .post("/carts/me/items")
      .send({
        variantId,
        quantity: 1
      });

    const checkoutResponse =
      await request(testApp)
        .post("/orders/checkout");

    expect(checkoutResponse.status)
      .toBe(201);

    const orderId =
      checkoutResponse.body.order.id;

    const response =
      await request(testApp)
        .get(
          `/orders/me/${orderId}`
        );

    expect(response.status)
      .toBe(200);

    expect(response.body.id)
      .toBe(orderId);

    expect(response.body.customerId)
      .toBe(customerId);

    expect(response.body.status)
      .toBe("PENDING");

    expect(response.body.totalAmount)
      .toBe(100);

    expect(response.body.items)
      .toHaveLength(1);
  });

  it("should not return an order belonging to another customer", async () => {
    await request(testApp)
      .post("/carts/me/items")
      .send({
        variantId,
        quantity: 1
      });

    const checkoutResponse =
      await request(testApp)
        .post("/orders/checkout");

    expect(checkoutResponse.status)
      .toBe(201);

    const otherUserResult =
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
          `other-order-user-${Date.now()}-${Math.random()}`
        ]
      );

    const otherUserId =
      otherUserResult.rows[0].id;

    await postgresPool.query(
      `
        INSERT INTO customers (
          user_id,
          first_name,
          last_name
        )
        VALUES (
          $1,
          'Other',
          'Customer'
        )
      `,
      [otherUserId]
    );

    userId = otherUserId;

    const response =
      await request(testApp)
        .get(
          `/orders/me/${checkoutResponse.body.order.id}`
        );

    expect(response.status)
      .toBe(404);

    expect(response.body.message)
      .toBe("Order not found");
  });

  it("should reject checkout when the cart is empty", async () => {
    const cartResponse =
      await request(testApp)
        .get("/carts/me");

    expect(cartResponse.status)
      .toBe(200);

    expect(cartResponse.body.items)
      .toEqual([]);

    const response =
      await request(testApp)
        .post("/orders/checkout");

    expect(response.status)
      .toBe(400);

    expect(response.body.message)
      .toBe("Cart is empty");

    const ordersResult =
      await postgresPool.query(
        `
          SELECT id
          FROM orders
        `
      );

    const paymentsResult =
      await postgresPool.query(
        `
          SELECT id
          FROM payments
        `
      );

    expect(ordersResult.rows)
      .toHaveLength(0);

    expect(paymentsResult.rows)
      .toHaveLength(0);
  });

  it("should reject checkout when available stock became insufficient after adding the item", async () => {
    const addItemResponse =
      await request(testApp)
        .post("/carts/me/items")
        .send({
          variantId,
          quantity: 2
        });

    expect(addItemResponse.status)
      .toBe(200);

    await postgresPool.query(
      `
        UPDATE inventory_items
        SET reserved_quantity = 9
        WHERE variant_id = $1
      `,
      [variantId]
    );

    const response =
      await request(testApp)
        .post("/orders/checkout");

    expect(response.status)
      .toBe(409);

    expect(response.body.message)
      .toBe("Insufficient stock");

    const ordersResult =
      await postgresPool.query(
        `
          SELECT id
          FROM orders
        `
      );

    const paymentsResult =
      await postgresPool.query(
        `
          SELECT id
          FROM payments
        `
      );

    expect(ordersResult.rows)
      .toHaveLength(0);

    expect(paymentsResult.rows)
      .toHaveLength(0);

    const inventoryResult =
      await postgresPool.query<{
        quantity: number;
        reserved_quantity: number;
      }>(
        `
          SELECT
            quantity,
            reserved_quantity
          FROM inventory_items
          WHERE variant_id = $1
        `,
        [variantId]
      );

    expect(
      inventoryResult.rows[0].quantity
    ).toBe(10);

    expect(
      inventoryResult.rows[0]
        .reserved_quantity
    ).toBe(9);

    const cartResult =
      await postgresPool.query<{
        status: string;
      }>(
        `
          SELECT status
          FROM carts
          WHERE id = $1
        `,
        [addItemResponse.body.id]
      );

    expect(
      cartResult.rows[0].status
    ).toBe("ACTIVE");
  });

  it("should return an empty order history when the customer has no orders", async () => {
    const response =
      await request(testApp)
        .get("/orders/me");

    expect(response.status)
      .toBe(200);

    expect(response.body)
      .toEqual([]);
  });

  it("should return 404 when the authenticated user has no customer profile", async () => {
    await postgresPool.query(
      `
        DELETE FROM customers
        WHERE id = $1
      `,
      [customerId]
    );

    const response =
      await request(testApp)
        .get("/orders/me");

    expect(response.status)
      .toBe(404);

    expect(response.body.message)
      .toBe("Customer not found");
  });
});