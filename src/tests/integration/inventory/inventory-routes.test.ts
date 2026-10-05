import request from "supertest";
import {
  beforeEach,
  describe,
  expect,
  it
} from "vitest";
import { postgresPool } from "../../../shared/infrastructure/database/postgres.js";
import {
  createRbacTestApp,
  createTestUser
} from "../../helpers/rbac-test-app.js";

describe("Inventory routes", () => {
  const testContext = createRbacTestApp();

  beforeEach(async () => {
    await postgresPool.query(
      "DELETE FROM inventory_items"
    );

    const adminId =
      await createTestUser("admin");

    testContext.authenticateAs(adminId);
  });

  async function createProductVariant(): Promise<string> {
    const categoryResponse =
      await request(testContext.app)
        .post("/categories")
        .send({
          name: "Accessories",
          slug: `accessories-${Date.now()}-${Math.random()}`,
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
      await request(testContext.app)
        .post("/products")
        .send({
          name: "Logitech MX Master 3S",
          slug: `logitech-mx-master-${Date.now()}-${Math.random()}`,
          description: "Wireless mouse",
          categoryId: categoryResponse.body.id,
          attributes: {
            brand: "Logitech"
          },
          hasVariants: false,
          sku: `LOG-MX3S-${Date.now()}-${Math.random()}`,
          price: {
            amount: 120,
            currency: "USD"
          }
        });

    expect(productResponse.status).toBe(201);

    return productResponse.body.variants[0].id;
  }

  it("should create inventory for a product variant", async () => {
    const variantId =
      await createProductVariant();

    const response =
      await request(testContext.app)
        .post("/inventory")
        .send({
          variantId,
          quantity: 10
        });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.variantId)
      .toBe(variantId);
    expect(response.body.quantity).toBe(10);
    expect(response.body.reservedQuantity)
      .toBe(0);
    expect(response.body.availableQuantity)
      .toBe(10);
  });

  it("should get inventory by variant id", async () => {
    const variantId =
      await createProductVariant();

    await request(testContext.app)
      .post("/inventory")
      .send({
        variantId,
        quantity: 10
      });

    await postgresPool.query(
      `
        UPDATE inventory_items
        SET reserved_quantity = 3
        WHERE variant_id = $1
      `,
      [variantId]
    );

    const response =
      await request(testContext.app)
        .get(`/inventory/${variantId}`);

    expect(response.status).toBe(200);
    expect(response.body.variantId)
      .toBe(variantId);
    expect(response.body.quantity).toBe(10);
    expect(response.body.reservedQuantity)
      .toBe(3);
    expect(response.body.availableQuantity)
      .toBe(7);
  });

  it("should increase stock", async () => {
    const variantId =
      await createProductVariant();

    await request(testContext.app)
      .post("/inventory")
      .send({
        variantId,
        quantity: 10
      });

    const response =
      await request(testContext.app)
        .patch(
          `/inventory/${variantId}/stock`
        )
        .send({
          quantity: 5
        });

    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(15);
    expect(response.body.reservedQuantity)
      .toBe(0);
    expect(response.body.availableQuantity)
      .toBe(15);
  });

  it("should decrease stock", async () => {
    const variantId =
      await createProductVariant();

    await request(testContext.app)
      .post("/inventory")
      .send({
        variantId,
        quantity: 10
      });

    const response =
      await request(testContext.app)
        .patch(
          `/inventory/${variantId}/stock`
        )
        .send({
          quantity: -4
        });

    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(6);
    expect(response.body.reservedQuantity)
      .toBe(0);
    expect(response.body.availableQuantity)
      .toBe(6);
  });

  it("should not decrease stock below zero", async () => {
    const variantId =
      await createProductVariant();

    await request(testContext.app)
      .post("/inventory")
      .send({
        variantId,
        quantity: 5
      });

    const response =
      await request(testContext.app)
        .patch(
          `/inventory/${variantId}/stock`
        )
        .send({
          quantity: -6
        });

    expect(response.status).toBe(400);
    expect(response.body.message)
      .toBe("Insufficient stock");
  });

  it("should not decrease stock below reserved quantity", async () => {
    const variantId =
      await createProductVariant();

    await request(testContext.app)
      .post("/inventory")
      .send({
        variantId,
        quantity: 10
      });

    await postgresPool.query(
      `
        UPDATE inventory_items
        SET reserved_quantity = 6
        WHERE variant_id = $1
      `,
      [variantId]
    );

    const response =
      await request(testContext.app)
        .patch(
          `/inventory/${variantId}/stock`
        )
        .send({
          quantity: -5
        });

    expect(response.status).toBe(400);
    expect(response.body.message)
      .toBe(
        "Stock cannot be lower than reserved quantity"
      );
  });

  it("should not create duplicate inventory for a variant", async () => {
    const variantId =
      await createProductVariant();

    await request(testContext.app)
      .post("/inventory")
      .send({
        variantId,
        quantity: 10
      });

    const response =
      await request(testContext.app)
        .post("/inventory")
        .send({
          variantId,
          quantity: 20
        });

    expect(response.status).toBe(409);
    expect(response.body.message)
      .toBe(
        "Inventory already exists for this variant"
      );
  });

  it("should not create inventory for a non-existing variant", async () => {
    const response =
      await request(testContext.app)
        .post("/inventory")
        .send({
          variantId:
            "507f1f77bcf86cd799439011",
          quantity: 10
        });

    expect(response.status).toBe(404);
    expect(response.body.message)
      .toBe("Product variant not found");
  });

  it("should validate inventory quantity", async () => {
    const variantId =
      await createProductVariant();

    const response =
      await request(testContext.app)
        .post("/inventory")
        .send({
          variantId,
          quantity: -1
        });

    expect(response.status).toBe(400);
  });

  it("should reject zero stock adjustment", async () => {
    const variantId =
      await createProductVariant();

    await request(testContext.app)
      .post("/inventory")
      .send({
        variantId,
        quantity: 10
      });

    const response =
      await request(testContext.app)
        .patch(
          `/inventory/${variantId}/stock`
        )
        .send({
          quantity: 0
        });

    expect(response.status).toBe(400);
  });

  it("should reject inventory access without authentication", async () => {
    testContext.clearAuthentication();

    const response =
      await request(testContext.app)
        .get(
          "/inventory/507f1f77bcf86cd799439011"
        );

    expect(response.status).toBe(401);
    expect(response.body.message)
      .toBe("Unauthorized");
  });

  it("should reject inventory access without inventory permission", async () => {
    const customerId =
      await createTestUser("customer");

    testContext.authenticateAs(customerId);

    const response =
      await request(testContext.app)
        .get(
          "/inventory/507f1f77bcf86cd799439011"
        );

    expect(response.status).toBe(403);
    expect(response.body.message)
      .toBe("Forbidden");
  });
});