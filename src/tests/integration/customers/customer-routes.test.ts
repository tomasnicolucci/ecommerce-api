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
import { createCustomerRouter } from "../../../modules/customers/presentation/routes/customer-routes.js";
import { postgresPool } from "../../../shared/infrastructure/database/postgres.js";
import { errorHandler } from "../../../shared/presentation/middlewares/error-handler.js";

describe("Customer routes", () => {
  let userId: string;

  const fakeAuthenticate: RequestHandler = (
    req,
    _res,
    next
  ) => {
    req.auth = {
      userId,
      authUserId: "auth-customer-test"
    };

    next();
  };

  const testApp = express();

  testApp.use(express.json());

  testApp.use(
    "/customers",
    createCustomerRouter(fakeAuthenticate)
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
      "DELETE FROM user_roles"
    );

    await postgresPool.query(
      "DELETE FROM users"
    );

    const result =
      await postgresPool.query<{ id: string }>(
        `
          INSERT INTO users (auth_user_id)
          VALUES ($1)
          RETURNING id
        `,
        [
          `auth-customer-test-${Date.now()}-${Math.random()}`
        ]
      );

    userId = result.rows[0].id;
  });

  it("should create the authenticated customer", async () => {
    const response =
      await request(testApp)
        .post("/customers/me")
        .send({
          firstName: "John",
          lastName: "Doe"
        });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.userId).toBe(userId);
    expect(response.body.firstName)
      .toBe("John");
    expect(response.body.lastName)
      .toBe("Doe");
  });

  it("should create a customer with null profile fields", async () => {
    const response =
      await request(testApp)
        .post("/customers/me")
        .send({
          firstName: null,
          lastName: null
        });

    expect(response.status).toBe(201);
    expect(response.body.firstName)
      .toBeNull();
    expect(response.body.lastName)
      .toBeNull();
  });

  it("should ignore a userId sent by the client", async () => {
    const response =
      await request(testApp)
        .post("/customers/me")
        .send({
          userId:
            "11111111-1111-4111-8111-111111111111",
          firstName: "John",
          lastName: "Doe"
        });

    expect(response.status).toBe(201);
    expect(response.body.userId).toBe(userId);
  });

  it("should not create more than one customer for the authenticated user", async () => {
    await request(testApp)
      .post("/customers/me")
      .send({
        firstName: "John",
        lastName: "Doe"
      });

    const response =
      await request(testApp)
        .post("/customers/me")
        .send({
          firstName: "Jane",
          lastName: "Doe"
        });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe(
      "Customer already exists for this user"
    );
  });

  it("should get the authenticated customer", async () => {
    const created =
      await request(testApp)
        .post("/customers/me")
        .send({
          firstName: "John",
          lastName: "Doe"
        });

    expect(created.status).toBe(201);

    const response =
      await request(testApp)
        .get("/customers/me");

    expect(response.status).toBe(200);
    expect(response.body.id)
      .toBe(created.body.id);
    expect(response.body.userId)
      .toBe(userId);
  });

  it("should return 404 when the authenticated user has no customer", async () => {
    const response =
      await request(testApp)
        .get("/customers/me");

    expect(response.status).toBe(404);
    expect(response.body.message)
      .toBe("Customer not found");
  });

  it("should update the authenticated customer", async () => {
    await request(testApp)
      .post("/customers/me")
      .send({
        firstName: "John",
        lastName: "Doe"
      });

    const response =
      await request(testApp)
        .patch("/customers/me")
        .send({
          firstName: "Jane",
          lastName: "Smith"
        });

    expect(response.status).toBe(200);
    expect(response.body.firstName)
      .toBe("Jane");
    expect(response.body.lastName)
      .toBe("Smith");
  });

  it("should update only one profile field", async () => {
    await request(testApp)
      .post("/customers/me")
      .send({
        firstName: "John",
        lastName: "Doe"
      });

    const response =
      await request(testApp)
        .patch("/customers/me")
        .send({
          firstName: "Jane"
        });

    expect(response.status).toBe(200);
    expect(response.body.firstName)
      .toBe("Jane");
    expect(response.body.lastName)
      .toBe("Doe");
  });

  it("should return 404 when updating without a customer profile", async () => {
    const response =
      await request(testApp)
        .patch("/customers/me")
        .send({
          firstName: "Jane"
        });

    expect(response.status).toBe(404);
    expect(response.body.message)
      .toBe("Customer not found");
  });

  it("should validate customer creation", async () => {
    const response =
      await request(testApp)
        .post("/customers/me")
        .send({
          firstName: "",
          lastName: "Doe"
        });

    expect(response.status).toBe(400);
  });
});