import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { postgresPool } from "../../../shared/infrastructure/database/postgres.js";
import { createRbacTestApp, createTestUser } from "../../helpers/rbac-test-app.js";

describe("Promotion routes", () => {
    const testContext = createRbacTestApp();

    const validPromotion = {
        code: "WELCOME10",
        discountType: "PERCENTAGE",
        discountValue: 10,
        minSubtotal: 50,
        startsAt: "2026-01-01T00:00:00.000Z",
        expiresAt: "2027-01-01T00:00:00.000Z",
        maxUses: 100,
        active: true
    };

    beforeEach(async () => {
        await postgresPool.query(
            "DELETE FROM promotion_redemptions"
        );

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
            "DELETE FROM promotions"
        );

        const adminId = await createTestUser("admin");

        testContext.authenticateAs(adminId);
    });

    async function createPromotion(
        overrides: Record<string, unknown> = {}
    ) {
        return request(testContext.app)
            .post("/promotions")
            .send({
                ...validPromotion,
                ...overrides
            });
    }

    it("should create a percentage promotion", async () => {
        const response = await createPromotion();

        expect(response.status).toBe(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.code).toBe("WELCOME10");
        expect(response.body.discountType).toBe("PERCENTAGE");
        expect(response.body.discountValue).toBe(10);
        expect(response.body.minSubtotal).toBe(50);
        expect(response.body.maxUses).toBe(100);
        expect(response.body.active).toBe(true);
    });

    it("should create a fixed amount promotion", async () => {
        const response = await createPromotion({
            code: "SAVE25",
            discountType: "FIXED",
            discountValue: 25
        });

        expect(response.status).toBe(201);
        expect(response.body.discountType).toBe("FIXED");
        expect(response.body.discountValue).toBe(25);
    });

    it("should normalize promotion codes", async () => {
        const response = await createPromotion({
            code: "welcome10"
        });

        expect(response.status).toBe(201);
        expect(response.body.code).toBe("WELCOME10");
    });

    it("should reject duplicate promotion codes", async () => {
        const first = await createPromotion();

        expect(first.status).toBe(201);

        const second = await createPromotion({
            code: "welcome10"
        });

        expect(second.status).toBe(409);
        expect(second.body.message).toBe(
            "Promotion code already exists"
        );
    });

    it("should list promotions", async () => {
        await createPromotion();

        await createPromotion({
            code: "SAVE25",
            discountType: "FIXED",
            discountValue: 25
        });

        const response = await request(testContext.app)
            .get("/promotions");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);

        expect(
            response.body.map(
                (promotion: { code: string }) => promotion.code
            )
        ).toEqual(
            expect.arrayContaining([
                "WELCOME10",
                "SAVE25"
            ])
        );
    });

    it("should get a promotion by id", async () => {
        const created = await createPromotion();

        const response = await request(testContext.app)
            .get(`/promotions/${created.body.id}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(created.body.id);
        expect(response.body.code).toBe("WELCOME10");
    });

    it("should return 404 for a missing promotion", async () => {
        const response = await request(testContext.app)
            .get(
                "/promotions/00000000-0000-4000-8000-000000000001"
            );

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(
            "Promotion not found"
        );
    });

    it("should update a promotion", async () => {
        const created = await createPromotion();

        const response = await request(testContext.app)
            .patch(`/promotions/${created.body.id}`)
            .send({
                discountValue: 20,
                minSubtotal: 100
            });

        expect(response.status).toBe(200);
        expect(response.body.discountValue).toBe(20);
        expect(response.body.minSubtotal).toBe(100);
        expect(response.body.code).toBe("WELCOME10");
    });

    it("should reject updating a code to an existing code", async () => {
        const first = await createPromotion();

        const second = await createPromotion({
            code: "SAVE25"
        });

        const response = await request(testContext.app)
            .patch(`/promotions/${second.body.id}`)
            .send({
                code: first.body.code
            });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe(
            "Promotion code already exists"
        );
    });

    it("should deactivate a promotion", async () => {
        const created = await createPromotion();

        const response = await request(testContext.app)
            .delete(`/promotions/${created.body.id}`);

        expect(response.status).toBe(204);

        const result = await postgresPool.query<{
            active: boolean;
        }>(
            `
        SELECT active
        FROM promotions
        WHERE id = $1
      `,
            [created.body.id]
        );

        expect(result.rows[0].active).toBe(false);
    });

    it("should reject percentage discounts above 100", async () => {
        const response = await createPromotion({
            discountValue: 150
        });

        expect(response.status).toBe(400);
    });

    it("should reject invalid date ranges", async () => {
        const response = await createPromotion({
            startsAt: "2027-01-01T00:00:00.000Z",
            expiresAt: "2026-01-01T00:00:00.000Z"
        });

        expect(response.status).toBe(400);
    });

    it("should reject invalid maximum uses", async () => {
        const response = await createPromotion({
            maxUses: 0
        });

        expect(response.status).toBe(400);
    });

    it("should reject an empty update", async () => {
        const created = await createPromotion();

        const response = await request(testContext.app)
            .patch(`/promotions/${created.body.id}`)
            .send({});

        expect(response.status).toBe(400);
    });

    it("should prevent customers from managing promotions", async () => {
        const customerId = await createTestUser("customer");

        testContext.authenticateAs(customerId);

        const response = await createPromotion();

        expect(response.status).toBe(403);
    });

    it("should prevent unauthenticated access", async () => {
        testContext.clearAuthentication();

        const response = await request(testContext.app)
            .get("/promotions");

        expect(response.status).toBe(401);
    });

    it("should persist promotion updates", async () => {
        const created = await createPromotion();

        await request(testContext.app)
            .patch(`/promotions/${created.body.id}`)
            .send({
                discountValue: 30
            });

        const result = await postgresPool.query<{
            discount_value: string;
        }>(
            `
        SELECT discount_value
        FROM promotions
        WHERE id = $1
      `,
            [created.body.id]
        );

        expect(Number(result.rows[0].discount_value)).toBe(30);
    });
});