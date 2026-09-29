import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../../../app.js";
import { postgresPool } from "../../../shared/infrastructure/database/postgres.js";

describe("Inventory routes", () => {
  beforeEach(async () => {
    await postgresPool.query(
      "DELETE FROM inventory_items"
    );
  });

  async function createProductVariant(): Promise<string> {
    const categoryResponse = await request(app)
      .post("/categories")
      .send({
        name: "Accessories",
        slug: `accessories-${Date.now()}`,
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

    const productResponse = await request(app)
      .post("/products")
      .send({
        name: "Logitech MX Master 3S",
        slug: `logitech-mx-master-${Date.now()}`,
        description: "Wireless mouse",
        categoryId: categoryResponse.body.id,
        attributes: {
          brand: "Logitech"
        },
        hasVariants: false,
        sku: `LOG-MX3S-${Date.now()}`,
        price: {
          amount: 120,
          currency: "USD"
        }
      });

    expect(productResponse.status).toBe(201);

    return productResponse.body.variants[0].id;
  }

  it("should create inventory for a product variant", async () => {
    const variantId = await createProductVariant();

    const response = await request(app)
      .post("/inventory")
      .send({
        variantId,
        quantity: 10
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.variantId).toBe(variantId);
    expect(response.body.quantity).toBe(10);
  });

  it("should get inventory by variant id", async () => {
    const variantId = await createProductVariant();

    await request(app)
      .post("/inventory")
      .send({
        variantId,
        quantity: 10
      });

    const response = await request(app)
      .get(`/inventory/${variantId}`);

    expect(response.status).toBe(200);
    expect(response.body.variantId).toBe(variantId);
    expect(response.body.quantity).toBe(10);
  });

  it("should increase stock", async () => {
    const variantId = await createProductVariant();

    await request(app)
      .post("/inventory")
      .send({
        variantId,
        quantity: 10
      });

    const response = await request(app)
      .patch(`/inventory/${variantId}/stock`)
      .send({
        quantity: 5
      });

    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(15);
  });

  it("should decrease stock", async () => {
    const variantId = await createProductVariant();

    await request(app)
      .post("/inventory")
      .send({
        variantId,
        quantity: 10
      });

    const response = await request(app)
      .patch(`/inventory/${variantId}/stock`)
      .send({
        quantity: -4
      });

    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(6);
  });

  it("should not decrease stock below zero", async () => {
    const variantId = await createProductVariant();

    await request(app)
      .post("/inventory")
      .send({
        variantId,
        quantity: 5
      });

    const response = await request(app)
      .patch(`/inventory/${variantId}/stock`)
      .send({
        quantity: -6
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Insufficient stock"
    );
  });

  it("should not create duplicate inventory for a variant", async () => {
    const variantId = await createProductVariant();

    await request(app)
      .post("/inventory")
      .send({
        variantId,
        quantity: 10
      });

    const response = await request(app)
      .post("/inventory")
      .send({
        variantId,
        quantity: 20
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe(
      "Inventory already exists for this variant"
    );
  });

  it("should not create inventory for a non-existing variant", async () => {
    const response = await request(app)
      .post("/inventory")
      .send({
        variantId: "507f1f77bcf86cd799439011",
        quantity: 10
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(
      "Product variant not found"
    );
  });

  it("should validate inventory quantity", async () => {
    const variantId = await createProductVariant();

    const response = await request(app)
      .post("/inventory")
      .send({
        variantId,
        quantity: -1
      });

    expect(response.status).toBe(400);
  });

  it("should reject zero stock adjustment", async () => {
    const variantId = await createProductVariant();

    await request(app)
      .post("/inventory")
      .send({
        variantId,
        quantity: 10
      });

    const response = await request(app)
      .patch(`/inventory/${variantId}/stock`)
      .send({
        quantity: 0
      });

    expect(response.status).toBe(400);
  });
});