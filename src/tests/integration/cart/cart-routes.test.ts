import request from "supertest";
import {
  beforeEach,
  describe,
  expect,
  it
} from "vitest";
import { app } from "../../../app.js";
import { postgresPool } from "../../../shared/infrastructure/database/postgres.js";

describe("Cart routes", () => {
  let customerId: string;
  let variantId: string;

  beforeEach(async () => {
    await postgresPool.query("DELETE FROM cart_items");
    await postgresPool.query("DELETE FROM carts");
    await postgresPool.query("DELETE FROM customers");
    await postgresPool.query("DELETE FROM users");
    await postgresPool.query("DELETE FROM inventory_items");

    const userResult = await postgresPool.query(
      `
        INSERT INTO users (auth_user_id)
        VALUES ($1)
        RETURNING id
      `,
      [`auth-user-${Date.now()}`]
    );

    const customerResult = await postgresPool.query(
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
        userResult.rows[0].id,
        "Test",
        "Customer"
      ]
    );

    customerId = customerResult.rows[0].id;

    const categoryResponse = await request(app)
      .post("/categories")
      .send({
        name: "Cart Test Category",
        slug: `cart-test-${Date.now()}`,
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

    const productResponse = await request(app)
      .post("/products")
      .send({
        name: "Cart Test Product",
        slug: `cart-product-${Date.now()}`,
        description: "Product for cart tests",
        categoryId: categoryResponse.body.id,
        attributes: {
          brand: "Test"
        },
        hasVariants: false,
        sku: `CART-SKU-${Date.now()}`,
        price: {
          amount: 100,
          currency: "USD"
        }
      });

    expect(productResponse.status).toBe(201);

    variantId =
      productResponse.body.variants[0].id;

    const inventoryResponse = await request(app)
      .post("/inventory")
      .send({
        variantId,
        quantity: 10
      });

    expect(inventoryResponse.status).toBe(201);
  });

  it("should get or create the active cart", async () => {
    const response = await request(app)
      .get(`/carts/${customerId}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBeDefined();
    expect(response.body.customerId).toBe(customerId);
    expect(response.body.status).toBe("ACTIVE");
    expect(response.body.items).toEqual([]);
  });

  it("should add an item to the cart", async () => {
    const response = await request(app)
      .post(`/carts/${customerId}/items`)
      .send({
        variantId,
        quantity: 2
      });

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].variantId)
      .toBe(variantId);
    expect(response.body.items[0].quantity)
      .toBe(2);
  });

  it("should increase quantity when adding the same variant again", async () => {
    await request(app)
      .post(`/carts/${customerId}/items`)
      .send({
        variantId,
        quantity: 2
      });

    const response = await request(app)
      .post(`/carts/${customerId}/items`)
      .send({
        variantId,
        quantity: 3
      });

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].quantity)
      .toBe(5);
  });

  it("should update item quantity", async () => {
    await request(app)
      .post(`/carts/${customerId}/items`)
      .send({
        variantId,
        quantity: 2
      });

    const response = await request(app)
      .patch(
        `/carts/${customerId}/items/${variantId}`
      )
      .send({
        quantity: 6
      });

    expect(response.status).toBe(200);
    expect(response.body.items[0].quantity)
      .toBe(6);
  });

  it("should remove an item from the cart", async () => {
    await request(app)
      .post(`/carts/${customerId}/items`)
      .send({
        variantId,
        quantity: 2
      });

    const response = await request(app)
      .delete(
        `/carts/${customerId}/items/${variantId}`
      );

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
  });

  it("should reject quantity greater than available stock", async () => {
    const response = await request(app)
      .post(`/carts/${customerId}/items`)
      .send({
        variantId,
        quantity: 11
      });

    expect(response.status).toBe(400);
    expect(response.body.message)
      .toBe("Insufficient stock");
  });

  it("should reject zero quantity", async () => {
    const response = await request(app)
      .post(`/carts/${customerId}/items`)
      .send({
        variantId,
        quantity: 0
      });

    expect(response.status).toBe(400);
  });
});