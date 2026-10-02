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
import { postgresPool } from "../../../shared/infrastructure/database/postgres.js";
import { errorHandler } from "../../../shared/presentation/middlewares/error-handler.js";
import {
  createRbacTestApp,
  createTestUser
} from "../../helpers/rbac-test-app.js";

describe("Cart routes", () => {
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
      authUserId: "auth-cart-test"
    };

    next();
  };

  const testApp = express();

  testApp.use(express.json());

  testApp.use(
    "/carts",
    createCartRouter(fakeAuthenticate)
  );

  testApp.use(errorHandler);

  beforeEach(async () => {
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
      await postgresPool.query<{ id: string }>(
        `
          INSERT INTO users (
            auth_user_id
          )
          VALUES ($1)
          RETURNING id
        `,
        [
          `auth-cart-test-${Date.now()}-${Math.random()}`
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
        [
          userId,
          "Test",
          "Customer"
        ]
      );

    customerId =
      customerResult.rows[0].id;

    const categoryResponse =
      await request(adminContext.app)
        .post("/categories")
        .send({
          name: "Cart Test Category",
          slug: `cart-test-${Date.now()}-${Math.random()}`,
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

    expect(categoryResponse.status).toBe(201);

    const productResponse =
      await request(adminContext.app)
        .post("/products")
        .send({
          name: "Cart Test Product",
          slug: `cart-product-${Date.now()}-${Math.random()}`,
          description: "Product for cart tests",
          categoryId: categoryResponse.body.id,
          attributes: {
            brand: "Test"
          },
          hasVariants: false,
          sku: `CART-SKU-${Date.now()}-${Math.random()}`,
          price: {
            amount: 100,
            currency: "USD"
          }
        });

    expect(productResponse.status).toBe(201);

    variantId =
      productResponse.body.variants[0].id;

    const inventoryResponse =
      await request(adminContext.app)
        .post("/inventory")
        .send({
          variantId,
          quantity: 10
        });

    expect(inventoryResponse.status).toBe(201);
  });

  it("should get or create the active cart for the authenticated customer", async () => {
    const response =
      await request(testApp)
        .get("/carts/me");

    expect(response.status).toBe(200);

    expect(response.body.id)
      .toBeDefined();

    expect(response.body.customerId)
      .toBe(customerId);

    expect(response.body.status)
      .toBe("ACTIVE");

    expect(response.body.items)
      .toEqual([]);
  });

  it("should add an item to the authenticated customer cart", async () => {
    const response =
      await request(testApp)
        .post("/carts/me/items")
        .send({
          variantId,
          quantity: 2
        });

    expect(response.status).toBe(200);

    expect(response.body.customerId)
      .toBe(customerId);

    expect(response.body.items)
      .toHaveLength(1);

    expect(
      response.body.items[0].variantId
    ).toBe(variantId);

    expect(
      response.body.items[0].quantity
    ).toBe(2);
  });

  it("should increase quantity when adding the same variant again", async () => {
    await request(testApp)
      .post("/carts/me/items")
      .send({
        variantId,
        quantity: 2
      });

    const response =
      await request(testApp)
        .post("/carts/me/items")
        .send({
          variantId,
          quantity: 3
        });

    expect(response.status).toBe(200);

    expect(response.body.items)
      .toHaveLength(1);

    expect(
      response.body.items[0].quantity
    ).toBe(5);
  });

  it("should update item quantity", async () => {
    await request(testApp)
      .post("/carts/me/items")
      .send({
        variantId,
        quantity: 2
      });

    const response =
      await request(testApp)
        .patch(
          `/carts/me/items/${variantId}`
        )
        .send({
          quantity: 6
        });

    expect(response.status).toBe(200);

    expect(
      response.body.items[0].quantity
    ).toBe(6);
  });

  it("should remove an item from the cart", async () => {
    await request(testApp)
      .post("/carts/me/items")
      .send({
        variantId,
        quantity: 2
      });

    const response =
      await request(testApp)
        .delete(
          `/carts/me/items/${variantId}`
        );

    expect(response.status).toBe(200);

    expect(response.body.items)
      .toEqual([]);
  });

  it("should reject quantity greater than available stock", async () => {
    const response =
      await request(testApp)
        .post("/carts/me/items")
        .send({
          variantId,
          quantity: 11
        });

    expect(response.status).toBe(400);

    expect(response.body.message)
      .toBe("Insufficient stock");
  });

  it("should reject zero quantity", async () => {
    const response =
      await request(testApp)
        .post("/carts/me/items")
        .send({
          variantId,
          quantity: 0
        });

    expect(response.status).toBe(400);
  });

  it("should return 404 when the authenticated user has no customer profile", async () => {
    await postgresPool.query(
      "DELETE FROM customers"
    );

    const response =
      await request(testApp)
        .get("/carts/me");

    expect(response.status).toBe(404);

    expect(response.body.message)
      .toBe("Customer not found");
  });
});