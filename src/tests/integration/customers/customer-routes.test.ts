import request from "supertest";
import {
    beforeEach,
    describe,
    expect,
    it
} from "vitest";
import { app } from "../../../app.js";
import { postgresPool } from "../../../shared/infrastructure/database/postgres.js";

describe("Customer routes", () => {
    let userId: string;

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
            "DELETE FROM users"
        );

        const result = await postgresPool.query(
            `
        INSERT INTO users (auth_user_id)
        VALUES ($1)
        RETURNING id
      `,
            [`auth-customer-test-${Date.now()}`]
        );

        userId = result.rows[0].id;
    });

    it("should create a customer", async () => {
        const response = await request(app)
            .post("/customers")
            .send({
                userId,
                firstName: "John",
                lastName: "Doe"
            });

        expect(response.status).toBe(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.userId).toBe(userId);
        expect(response.body.firstName).toBe("John");
        expect(response.body.lastName).toBe("Doe");
    });

    it("should create a customer with null profile fields", async () => {
        const response = await request(app)
            .post("/customers")
            .send({
                userId,
                firstName: null,
                lastName: null
            });

        expect(response.status).toBe(201);
        expect(response.body.firstName).toBeNull();
        expect(response.body.lastName).toBeNull();
    });

    it("should not create a customer for a non-existing user", async () => {
        const response = await request(app)
            .post("/customers")
            .send({
                userId: "11111111-1111-4111-8111-111111111111",
                firstName: "John",
                lastName: "Doe"
            });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(
            "User not found"
        );
    });

    it("should not create more than one customer for the same user", async () => {
        await request(app)
            .post("/customers")
            .send({
                userId,
                firstName: "John",
                lastName: "Doe"
            });

        const response = await request(app)
            .post("/customers")
            .send({
                userId,
                firstName: "Jane",
                lastName: "Doe"
            });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe(
            "Customer already exists for this user"
        );
    });

    it("should get a customer by id", async () => {
        const created = await request(app)
            .post("/customers")
            .send({
                userId,
                firstName: "John",
                lastName: "Doe"
            });

        const response = await request(app)
            .get(`/customers/${created.body.id}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(
            created.body.id
        );
        expect(response.body.userId).toBe(userId);
    });

    it("should return 404 when customer does not exist", async () => {
        const response = await request(app)
            .get(
                "/customers/00000000-0000-0000-0000-000000000001"
            );

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(
            "Customer not found"
        );
    });

    it("should get a customer by user id", async () => {
        const created = await request(app)
            .post("/customers")
            .send({
                userId,
                firstName: "John",
                lastName: "Doe"
            });

        expect(created.status).toBe(201);

        const response = await request(app)
            .get(`/customers/user/${userId}`);

        expect(response.status).toBe(200);
        expect(response.body.userId).toBe(userId);
    });

    it("should update a customer", async () => {
        const created = await request(app)
            .post("/customers")
            .send({
                userId,
                firstName: "John",
                lastName: "Doe"
            });

        const response = await request(app)
            .patch(`/customers/${created.body.id}`)
            .send({
                firstName: "Jane",
                lastName: "Smith"
            });

        expect(response.status).toBe(200);
        expect(response.body.firstName).toBe("Jane");
        expect(response.body.lastName).toBe("Smith");
    });

    it("should update only one profile field", async () => {
        const created = await request(app)
            .post("/customers")
            .send({
                userId,
                firstName: "John",
                lastName: "Doe"
            });

        const response = await request(app)
            .patch(`/customers/${created.body.id}`)
            .send({
                firstName: "Jane"
            });

        expect(response.status).toBe(200);
        expect(response.body.firstName).toBe("Jane");
        expect(response.body.lastName).toBe("Doe");
    });

    it("should validate customer creation", async () => {
        const response = await request(app)
            .post("/customers")
            .send({
                userId: "invalid-id",
                firstName: "John",
                lastName: "Doe"
            });

        expect(response.status).toBe(400);
    });
});