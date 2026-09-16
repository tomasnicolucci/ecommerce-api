import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../../app.js";

describe("Product routes", () => {
  it("should create a product", async () => {
    const categoryResponse = await request(app)
      .post("/categories")
      .send({
        name: "Smartphones",
        slug: "smartphones",
        parentId: null,
        attributes: [
          {
            name: "brand",
            type: "string",
            scope: "product",
            required: true
          },
          {
            name: "model",
            type: "string",
            scope: "product",
            required: true
          },
          {
            name: "color",
            type: "select",
            scope: "variant",
            required: true,
            options: ["Black", "White", "Blue", "Silver"]
          },
          {
            name: "storage",
            type: "select",
            scope: "variant",
            required: true,
            options: ["128GB", "256GB", "512GB"]
          }
        ]
      });

    expect(categoryResponse.status).toBe(201);

    const response = await request(app)
      .post("/products")
      .send({
        name: "Samsung Galaxy S25",
        slug: "samsung-galaxy-s25",
        description: "Samsung Galaxy S25 smartphone",
        categoryId: categoryResponse.body.id,
        attributes: {
          brand: "Samsung",
          model: "Galaxy S25"
        },
        variants: [
          {
            sku: "S25-BLK-128",
            attributes: {
              color: "Black",
              storage: "128GB"
            },
            price: {
              amount: 899,
              currency: "USD"
            }
          },
          {
            sku: "S25-BLU-256",
            attributes: {
              color: "Blue",
              storage: "256GB"
            },
            price: {
              amount: 999,
              currency: "USD"
            }
          }
        ]
      });

    expect(response.status).toBe(201);

    expect(response.body.name).toBe("Samsung Galaxy S25");
    expect(response.body.slug).toBe("samsung-galaxy-s25");
    expect(response.body.categoryId).toBe(categoryResponse.body.id);

    expect(response.body.attributes).toEqual({
      brand: "Samsung",
      model: "Galaxy S25"
    });

    expect(response.body.variants).toHaveLength(2);

    expect(response.body.variants[0].sku).toBe(
      "S25-BLK-128"
    );

    expect(response.body.variants[0].price).toEqual({
      amount: 899,
      currency: "USD"
    });

    expect(response.body.variants[0].active).toBe(true);
    expect(response.body.active).toBe(true);
  });

  it("should not create a product with invalid attributes", async () => {
    const categoryResponse = await request(app)
      .post("/categories")
      .send({
        name: "Smartphones",
        slug: "smartphones",
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

    const response = await request(app)
      .post("/products")
      .send({
        name: "Samsung Galaxy S25",
        slug: "samsung-galaxy-s25",
        description: "",
        categoryId: categoryResponse.body.id,
        attributes: {},
        variants: []
      });

    expect(response.status).toBe(500);
  });

  it("should get all products", async () => {
    const categoryResponse = await request(app)
      .post("/categories")
      .send({
        name: "Smartphones",
        slug: "smartphones",
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
        name: "Samsung Galaxy S25",
        slug: "samsung-galaxy-s25",
        description: "Samsung Galaxy S25 smartphone",
        categoryId: categoryResponse.body.id,
        attributes: {
          brand: "Samsung"
        },
        variants: []
      });

    expect(productResponse.status).toBe(201);

    const response = await request(app)
      .get("/products");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);

    expect(response.body[0].name).toBe(
      "Samsung Galaxy S25"
    );

    expect(response.body[0].slug).toBe(
      "samsung-galaxy-s25"
    );

    expect(response.body[0].categoryId).toBe(
      categoryResponse.body.id
    );

    expect(response.body[0].active).toBe(true);
  });

  it("should get a product by id", async () => {
    const categoryResponse = await request(app)
      .post("/categories")
      .send({
        name: "Smartphones",
        slug: "smartphones",
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
        name: "Samsung Galaxy S25",
        slug: "samsung-galaxy-s25",
        description: "Samsung Galaxy S25 smartphone",
        categoryId: categoryResponse.body.id,
        attributes: {
          brand: "Samsung"
        },
        variants: []
      });

    expect(productResponse.status).toBe(201);

    const response = await request(app)
      .get(`/products/${productResponse.body.id}`);

    expect(response.status).toBe(200);

    expect(response.body.id).toBe(
      productResponse.body.id
    );

    expect(response.body.name).toBe(
      "Samsung Galaxy S25"
    );

    expect(response.body.slug).toBe(
      "samsung-galaxy-s25"
    );

    expect(response.body.categoryId).toBe(
      categoryResponse.body.id
    );

    expect(response.body.attributes).toEqual({
      brand: "Samsung"
    });

    expect(response.body.active).toBe(true);
  });
});