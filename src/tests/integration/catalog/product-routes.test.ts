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

  it("should update a product", async () => {
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
        description: "Original description",
        categoryId: categoryResponse.body.id,
        attributes: {
          brand: "Samsung"
        },
        variants: []
      });

    const response = await request(app)
      .patch(`/products/${productResponse.body.id}`)
      .send({
        name: "Samsung Galaxy S25 Ultra",
        slug: "samsung-galaxy-s25-ultra",
        description: "Updated description"
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(productResponse.body.id);
    expect(response.body.name).toBe(
      "Samsung Galaxy S25 Ultra"
    );
    expect(response.body.slug).toBe(
      "samsung-galaxy-s25-ultra"
    );
    expect(response.body.description).toBe(
      "Updated description"
    );

    expect(response.body.categoryId).toBe(
      categoryResponse.body.id
    );

    expect(response.body.attributes).toEqual({
      brand: "Samsung"
    });
  });

  it("should delete a product", async () => {
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

    const deleteResponse = await request(app)
      .delete(`/products/${productResponse.body.id}`);

    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app)
      .get(`/products/${productResponse.body.id}`);

    expect(getResponse.status).toBe(404);
  });

  it("should get product variants", async () => {
    const categoryResponse = await request(app)
      .post("/categories")
      .send({
        name: "Smartphones",
        slug: "smartphones",
        parentId: null,
        attributes: [
          {
            name: "color",
            type: "string",
            scope: "variant",
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
        attributes: {},
        variants: [
          {
            sku: "S25-BLACK",
            attributes: {
              color: "black"
            },
            price: {
              amount: 1200,
              currency: "USD"
            }
          }
        ]
      });

    const response = await request(app)
      .get(`/products/${productResponse.body.id}/variants`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].sku).toBe("S25-BLACK");
    expect(response.body[0].attributes).toEqual({
      color: "black"
    });
    expect(response.body[0].price).toEqual({
      amount: 1200,
      currency: "USD"
    });
  });

  it("should get a product variant by id", async () => {
    const categoryResponse = await request(app)
      .post("/categories")
      .send({
        name: "Smartphones",
        slug: "smartphones",
        parentId: null,
        attributes: [
          {
            name: "color",
            type: "string",
            scope: "variant",
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
        attributes: {},
        variants: [
          {
            sku: "S25-BLACK",
            attributes: {
              color: "black"
            },
            price: {
              amount: 1200,
              currency: "USD"
            }
          }
        ]
      });

    const variantId = productResponse.body.variants[0].id;

    const response = await request(app)
      .get(
        `/products/${productResponse.body.id}/variants/${variantId}`
      );

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(variantId);
    expect(response.body.sku).toBe("S25-BLACK");
    expect(response.body.attributes).toEqual({
      color: "black"
    });
    expect(response.body.price).toEqual({
      amount: 1200,
      currency: "USD"
    });
  });

  it("should create a product variant", async () => {
    const categoryResponse = await request(app)
      .post("/categories")
      .send({
        name: "Smartphones",
        slug: "smartphones",
        parentId: null,
        attributes: [
          {
            name: "color",
            type: "string",
            scope: "variant",
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
        attributes: {},
        variants: []
      });

    const response = await request(app)
      .post(`/products/${productResponse.body.id}/variants`)
      .send({
        sku: "S25-BLACK",
        attributes: {
          color: "black"
        },
        price: {
          amount: 1200,
          currency: "USD"
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.sku).toBe("S25-BLACK");
    expect(response.body.attributes).toEqual({
      color: "black"
    });
    expect(response.body.price).toEqual({
      amount: 1200,
      currency: "USD"
    });
    expect(response.body.active).toBe(true);
  });

  it("should update a product variant", async () => {
    const categoryResponse = await request(app)
      .post("/categories")
      .send({
        name: "Smartphones",
        slug: "smartphones",
        parentId: null,
        attributes: [
          {
            name: "color",
            type: "string",
            scope: "variant",
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
        attributes: {},
        variants: [
          {
            sku: "S25-BLACK",
            attributes: {
              color: "black"
            },
            price: {
              amount: 1200,
              currency: "USD"
            }
          }
        ]
      });

    const variantId = productResponse.body.variants[0].id;

    const response = await request(app)
      .patch(
        `/products/${productResponse.body.id}/variants/${variantId}`
      )
      .send({
        sku: "S25-BLUE",
        attributes: {
          color: "blue"
        },
        price: {
          amount: 1250,
          currency: "USD"
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(variantId);
    expect(response.body.sku).toBe("S25-BLUE");
    expect(response.body.attributes).toEqual({
      color: "blue"
    });
    expect(response.body.price).toEqual({
      amount: 1250,
      currency: "USD"
    });
    expect(response.body.active).toBe(true);
  });
});