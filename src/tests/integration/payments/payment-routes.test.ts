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
import { createPaymentRouter } from "../../../modules/payments/presentation/routes/payment-routes.js";
import { postgresPool } from "../../../shared/infrastructure/database/postgres.js";
import { errorHandler } from "../../../shared/presentation/middlewares/error-handler.js";

describe("Payment routes", () => {
    let userId: string;
    let customerId: string;
    let orderId: string;
    let paymentId: string;

    const variantId =
        "507f1f77bcf86cd799439011";

    const fakeAuthenticate: RequestHandler = (
        req,
        _res,
        next
    ) => {
        req.auth = {
            userId,
            authUserId: "auth-payment-test"
        };

        next();
    };

    const testApp = express();

    testApp.use(express.json());

    testApp.use(
        "/payments",
        createPaymentRouter(fakeAuthenticate)
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
            "DELETE FROM inventory_items"
        );

        await postgresPool.query(
            "DELETE FROM user_roles"
        );

        await postgresPool.query(
            "DELETE FROM users"
        );

        const userResult =
            await postgresPool.query<{ id: string }>(
                `
          INSERT INTO users (auth_user_id)
          VALUES ($1)
          RETURNING id
        `,
                [
                    `payment-test-${Date.now()}-${Math.random()}`
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
                    "Payment",
                    "Test"
                ]
            );

        customerId =
            customerResult.rows[0].id;

        const cartResult =
            await postgresPool.query<{ id: string }>(
                `
          INSERT INTO carts (
            customer_id,
            status
          )
          VALUES ($1, 'COMPLETED')
          RETURNING id
        `,
                [customerId]
            );

        const orderResult =
            await postgresPool.query<{ id: string }>(
                `
          INSERT INTO orders (
            customer_id,
            cart_id,
            status,
            total_amount,
            currency
          )
          VALUES (
            $1,
            $2,
            'PENDING',
            200,
            'USD'
          )
          RETURNING id
        `,
                [
                    customerId,
                    cartResult.rows[0].id
                ]
            );

        orderId = orderResult.rows[0].id;

        await postgresPool.query(
            `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_variant_id,
          product_name,
          sku,
          unit_price,
          currency,
          quantity
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8
        )
      `,
            [
                orderId,
                "507f1f77bcf86cd799439012",
                variantId,
                "Test Product",
                "TEST-SKU",
                100,
                "USD",
                2
            ]
        );

        await postgresPool.query(
            `
        INSERT INTO inventory_items (
          variant_id,
          quantity,
          reserved_quantity
        )
        VALUES ($1, 10, 2)
      `,
            [variantId]
        );

        const paymentResult =
            await postgresPool.query<{ id: string }>(
                `
          INSERT INTO payments (
            order_id,
            status,
            amount,
            currency
          )
          VALUES (
            $1,
            'PENDING',
            200,
            'USD'
          )
          RETURNING id
        `,
                [orderId]
            );

        paymentId =
            paymentResult.rows[0].id;
    });

    it("should get the authenticated customer payment", async () => {
        const response =
            await request(testApp)
                .get(
                    `/payments/${paymentId}`
                );

        expect(response.status).toBe(200);
        expect(response.body.id)
            .toBe(paymentId);
        expect(response.body.orderId)
            .toBe(orderId);
        expect(response.body.status)
            .toBe("PENDING");
        expect(response.body.amount)
            .toBe(200);
        expect(response.body.currency)
            .toBe("USD");
        expect(response.body.resolvedAt)
            .toBeNull();
    });

    it("should approve payment, confirm order and consume reserved stock", async () => {
        const response =
            await request(testApp)
                .post(
                    `/payments/${paymentId}/approve`
                );

        expect(response.status).toBe(200);
        expect(response.body.status)
            .toBe("APPROVED");
        expect(response.body.resolvedAt)
            .not.toBeNull();

        const orderResult =
            await postgresPool.query(
                `
          SELECT status
          FROM orders
          WHERE id = $1
        `,
                [orderId]
            );

        expect(orderResult.rows[0].status)
            .toBe("CONFIRMED");

        const inventoryResult =
            await postgresPool.query(
                `
          SELECT
            quantity,
            reserved_quantity
          FROM inventory_items
          WHERE variant_id = $1
        `,
                [variantId]
            );

        expect(
            inventoryResult.rows[0].quantity
        ).toBe(8);

        expect(
            inventoryResult.rows[0]
                .reserved_quantity
        ).toBe(0);
    });

    it("should reject payment, cancel order and release reserved stock", async () => {
        const response =
            await request(testApp)
                .post(
                    `/payments/${paymentId}/reject`
                );

        expect(response.status).toBe(200);
        expect(response.body.status)
            .toBe("REJECTED");
        expect(response.body.resolvedAt)
            .not.toBeNull();

        const orderResult =
            await postgresPool.query(
                `
          SELECT status
          FROM orders
          WHERE id = $1
        `,
                [orderId]
            );

        expect(orderResult.rows[0].status)
            .toBe("CANCELLED");

        const inventoryResult =
            await postgresPool.query(
                `
          SELECT
            quantity,
            reserved_quantity
          FROM inventory_items
          WHERE variant_id = $1
        `,
                [variantId]
            );

        expect(
            inventoryResult.rows[0].quantity
        ).toBe(10);

        expect(
            inventoryResult.rows[0]
                .reserved_quantity
        ).toBe(0);
    });

    it("should reject approving an already approved payment", async () => {
        const firstResponse =
            await request(testApp)
                .post(
                    `/payments/${paymentId}/approve`
                );

        expect(firstResponse.status)
            .toBe(200);

        const secondResponse =
            await request(testApp)
                .post(
                    `/payments/${paymentId}/approve`
                );

        expect(secondResponse.status)
            .toBe(409);

        expect(secondResponse.body.message)
            .toBe(
                "Payment is already resolved"
            );

        const inventoryResult =
            await postgresPool.query(
                `
          SELECT
            quantity,
            reserved_quantity
          FROM inventory_items
          WHERE variant_id = $1
        `,
                [variantId]
            );

        expect(
            inventoryResult.rows[0].quantity
        ).toBe(8);

        expect(
            inventoryResult.rows[0]
                .reserved_quantity
        ).toBe(0);
    });

    it("should reject rejecting an already rejected payment", async () => {
        const firstResponse =
            await request(testApp)
                .post(
                    `/payments/${paymentId}/reject`
                );

        expect(firstResponse.status)
            .toBe(200);

        const secondResponse =
            await request(testApp)
                .post(
                    `/payments/${paymentId}/reject`
                );

        expect(secondResponse.status)
            .toBe(409);

        expect(secondResponse.body.message)
            .toBe(
                "Payment is already resolved"
            );
    });

    it("should not reject an approved payment", async () => {
        await request(testApp)
            .post(
                `/payments/${paymentId}/approve`
            );

        const response =
            await request(testApp)
                .post(
                    `/payments/${paymentId}/reject`
                );

        expect(response.status).toBe(409);
        expect(response.body.message)
            .toBe(
                "Payment is already resolved"
            );
    });

    it("should not approve a rejected payment", async () => {
        await request(testApp)
            .post(
                `/payments/${paymentId}/reject`
            );

        const response =
            await request(testApp)
                .post(
                    `/payments/${paymentId}/approve`
                );

        expect(response.status).toBe(409);
        expect(response.body.message)
            .toBe(
                "Payment is already resolved"
            );
    });

    it("should return 404 when payment belongs to another customer", async () => {
        const otherUser =
            await postgresPool.query<{ id: string }>(
                `
          INSERT INTO users (auth_user_id)
          VALUES ($1)
          RETURNING id
        `,
                [
                    `other-payment-user-${Date.now()}-${Math.random()}`
                ]
            );

        userId = otherUser.rows[0].id;

        const response =
            await request(testApp)
                .get(
                    `/payments/${paymentId}`
                );

        expect(response.status).toBe(404);
        expect(response.body.message)
            .toBe("Payment not found");
    });

    it("should not allow another customer to approve a payment", async () => {
        const otherUser =
            await postgresPool.query<{ id: string }>(
                `
          INSERT INTO users (auth_user_id)
          VALUES ($1)
          RETURNING id
        `,
                [
                    `other-payment-user-${Date.now()}-${Math.random()}`
                ]
            );

        userId = otherUser.rows[0].id;

        const response =
            await request(testApp)
                .post(
                    `/payments/${paymentId}/approve`
                );

        expect(response.status).toBe(404);
        expect(response.body.message)
            .toBe("Payment not found");

        const paymentResult =
            await postgresPool.query(
                `
          SELECT status
          FROM payments
          WHERE id = $1
        `,
                [paymentId]
            );

        expect(paymentResult.rows[0].status)
            .toBe("PENDING");

        const inventoryResult =
            await postgresPool.query(
                `
          SELECT
            quantity,
            reserved_quantity
          FROM inventory_items
          WHERE variant_id = $1
        `,
                [variantId]
            );

        expect(
            inventoryResult.rows[0].quantity
        ).toBe(10);

        expect(
            inventoryResult.rows[0]
                .reserved_quantity
        ).toBe(2);
    });

    it("should resolve a payment only once when approve and reject run concurrently", async () => {
        const results =
            await Promise.all([
                request(testApp)
                    .post(
                        `/payments/${paymentId}/approve`
                    ),
                request(testApp)
                    .post(
                        `/payments/${paymentId}/reject`
                    )
            ]);

        const success =
            results.filter(
                (response) =>
                    response.status === 200
            );

        const conflict =
            results.filter(
                (response) =>
                    response.status === 409
            );

        expect(success)
            .toHaveLength(1);

        expect(conflict)
            .toHaveLength(1);

        const paymentResult =
            await postgresPool.query(
                `
          SELECT status
          FROM payments
          WHERE id = $1
        `,
                [paymentId]
            );

        const orderResult =
            await postgresPool.query(
                `
          SELECT status
          FROM orders
          WHERE id = $1
        `,
                [orderId]
            );

        const inventoryResult =
            await postgresPool.query(
                `
          SELECT
            quantity,
            reserved_quantity
          FROM inventory_items
          WHERE variant_id = $1
        `,
                [variantId]
            );

        const paymentStatus =
            paymentResult.rows[0].status;

        if (paymentStatus === "APPROVED") {
            expect(orderResult.rows[0].status)
                .toBe("CONFIRMED");

            expect(
                inventoryResult.rows[0].quantity
            ).toBe(8);
        } else {
            expect(paymentStatus)
                .toBe("REJECTED");

            expect(orderResult.rows[0].status)
                .toBe("CANCELLED");

            expect(
                inventoryResult.rows[0].quantity
            ).toBe(10);
        }

        expect(
            inventoryResult.rows[0]
                .reserved_quantity
        ).toBe(0);
    });
});