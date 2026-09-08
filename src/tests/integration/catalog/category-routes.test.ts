import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../../app.js";

describe("Category routes", () => {
  it("should create a category", async () => {
    const response = await request(app)
      .post("/categories")
      .send({
        name: "Technology",
        slug: "technology",
        parentId: null,
        attributes: []
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Technology");
    expect(response.body.slug).toBe("technology");
    expect(response.body.active).toBe(true);
    expect(response.body.id).toBeDefined();
  });

  it("should get all categories", async () => {
    await request(app)
      .post("/categories")
      .send({
        name: "Technology",
        slug: "technology",
        parentId: null,
        attributes: []
      });

    const response = await request(app)
      .get("/categories");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe("Technology");
  });

  it("should get a category by id", async () => {
    const created = await request(app)
      .post("/categories")
      .send({
        name: "Technology",
        slug: "technology",
        parentId: null,
        attributes: []
      });

    const response = await request(app)
      .get(`/categories/${created.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(created.body.id);
    expect(response.body.name).toBe("Technology");
  });

  it("should update a category", async () => {
    const created = await request(app)
      .post("/categories")
      .send({
        name: "Technology",
        slug: "technology",
        parentId: null,
        attributes: []
      });

    const response = await request(app)
      .patch(`/categories/${created.body.id}`)
      .send({
        name: "Electronics"
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Electronics");
  });

  it("should deactivate a category", async () => {
    const created = await request(app)
      .post("/categories")
      .send({
        name: "Technology",
        slug: "technology",
        parentId: null,
        attributes: []
      });

    const deleteResponse = await request(app)
      .delete(`/categories/${created.body.id}`);

    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app)
      .get(`/categories/${created.body.id}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.active).toBe(false);
  });
});