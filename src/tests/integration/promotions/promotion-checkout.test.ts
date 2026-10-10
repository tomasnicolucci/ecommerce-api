import { beforeEach, describe, expect, it } from "vitest";
import { postgresPool } from "../../../shared/infrastructure/database/postgres.js";
import { PostgresCheckoutRepository } from "../../../modules/orders/infrastructure/persistence/postgres/repositories/postgres-checkout-repository.js";
import { PostgresPaymentRepository } from "../../../modules/payments/infrastructure/persistence/postgres/repositories/postgres-payment-repository.js";
import type { CheckoutItemSnapshot } from "../../../modules/orders/domain/repositories/checkout-repository.js";

describe("Promotion checkout integration", () => {
    const checkoutRepository = new PostgresCheckoutRepository();
    const paymentRepository = new PostgresPaymentRepository();

    const variantId = "507f1f77bcf86cd799439011";

    const items: CheckoutItemSnapshot[] = [
        {
            variantId,
            productId: "507f1f77bcf86cd799439012",
            productName: "Test Product",
            sku: "PROMO-TEST",
            unitPrice: 100,
            currency: "USD",
            quantity: 2
        }
    ];

    async function createCustomer() {
        const user = await postgresPool.query<{ id: string }>(
            `
        INSERT INTO users (auth_user_id)
        VALUES ($1)
        RETURNING id
      `,
            [`promotion-${crypto.randomUUID()}`]
        );

        const userId = user.rows[0].id;

        const customer = await postgresPool.query<{ id: string }>(
            `
        INSERT INTO customers (user_id, first_name, last_name)
        VALUES ($1, 'Promotion', 'Test')
        RETURNING id
      `,
            [userId]
        );

        return {
            userId,
            customerId: customer.rows[0].id
        };
    }

    async function createCart(
        customerId: string,
        promotionCode: string | null = null
    ) {
        const cart = await postgresPool.query<{ id: string }>(
            `
        INSERT INTO carts (
          customer_id,
          status,
          promotion_code
        )
        VALUES ($1, 'ACTIVE', $2)
        RETURNING id
      `,
            [customerId, promotionCode]
        );

        const cartId = cart.rows[0].id;

        await postgresPool.query(
            `
        INSERT INTO cart_items (
          cart_id,
          product_variant_id,
          quantity
        )
        VALUES ($1, $2, 2)
      `,
            [cartId, variantId]
        );

        return cartId;
    }

    async function createPromotion(
        code: string,
        options: {
            discountType?: "PERCENTAGE" | "FIXED";
            discountValue?: number;
            maxUses?: number | null;
            minSubtotal?: number;
        } = {}
    ) {
        const result = await postgresPool.query<{ id: string }>(
            `
        INSERT INTO promotions (
          code,
          discount_type,
          discount_value,
          min_subtotal,
          starts_at,
          expires_at,
          max_uses,
          active
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          NOW() - INTERVAL '1 day',
          NOW() + INTERVAL '1 day',
          $5,
          TRUE
        )
        RETURNING id
      `,
            [
                code,
                options.discountType ?? "PERCENTAGE",
                options.discountValue ?? 10,
                options.minSubtotal ?? 0,
                options.maxUses ?? null
            ]
        );

        return result.rows[0].id;
    }

    async function getRedemption(orderId: string) {
        const result = await postgresPool.query<{
            status: string;
        }>(
            `
        SELECT status
        FROM promotion_redemptions
        WHERE order_id = $1
      `,
            [orderId]
        );

        return result.rows[0] ?? null;
    }

    beforeEach(async () => {
        await postgresPool.query("DELETE FROM promotion_redemptions");
        await postgresPool.query("DELETE FROM payments");
        await postgresPool.query("DELETE FROM order_items");
        await postgresPool.query("DELETE FROM orders");
        await postgresPool.query("DELETE FROM cart_items");
        await postgresPool.query("DELETE FROM carts");
        await postgresPool.query("DELETE FROM promotions");
        await postgresPool.query("DELETE FROM customers");
        await postgresPool.query("DELETE FROM inventory_items");
        await postgresPool.query("DELETE FROM user_roles");
        await postgresPool.query("DELETE FROM users");

        await postgresPool.query(
            `
        INSERT INTO inventory_items (
          variant_id,
          quantity,
          reserved_quantity
        )
        VALUES ($1, 100, 0)
      `,
            [variantId]
        );
    });

    it("should checkout without a promotion", async () => {
        const customer = await createCustomer();
        const cartId = await createCart(customer.customerId);

        const result = await checkoutRepository.checkout(
            customer.customerId,
            cartId,
            items
        );

        expect(result.order.subtotalAmount).toBe(200);
        expect(result.order.discountAmount).toBe(0);
        expect(result.order.totalAmount).toBe(200);
        expect(result.order.couponCode).toBeNull();

        const redemption = await getRedemption(result.order.id!);
        expect(redemption).toBeNull();
    });

    it("should reserve a percentage promotion and preserve the order snapshot", async () => {
        await createPromotion("SAVE10");

        const customer = await createCustomer();
        const cartId = await createCart(customer.customerId, "SAVE10");

        const result = await checkoutRepository.checkout(
            customer.customerId,
            cartId,
            items
        );

        expect(result.order.subtotalAmount).toBe(200);
        expect(result.order.discountAmount).toBe(20);
        expect(result.order.totalAmount).toBe(180);
        expect(result.order.couponCode).toBe("SAVE10");
        expect(result.order.discountType).toBe("PERCENTAGE");
        expect(result.order.discountValue).toBe(10);

        const redemption = await getRedemption(result.order.id!);
        expect(redemption?.status).toBe("RESERVED");

        const payment = await postgresPool.query<{ amount: string }>(
            "SELECT amount FROM payments WHERE id = $1",
            [result.paymentId]
        );

        expect(Number(payment.rows[0].amount)).toBe(180);

        const orderItem = await postgresPool.query<{
            unit_price: string;
        }>(
            "SELECT unit_price FROM order_items WHERE order_id = $1",
            [result.order.id]
        );

        expect(Number(orderItem.rows[0].unit_price)).toBe(100);
    });

    it("should prevent the same customer from using a reserved promotion twice", async () => {
        await createPromotion("ONCE10");

        const customer = await createCustomer();
        const firstCart = await createCart(customer.customerId, "ONCE10");

        await checkoutRepository.checkout(
            customer.customerId,
            firstCart,
            items
        );

        const secondCart = await postgresPool.query<{ id: string }>(
            `
        SELECT id
        FROM carts
        WHERE customer_id = $1 AND status = 'ACTIVE'
      `,
            [customer.customerId]
        );

        const secondCartId = secondCart.rows[0].id;

        await postgresPool.query(
            `
        INSERT INTO cart_items (
          cart_id,
          product_variant_id,
          quantity
        )
        VALUES ($1, $2, 2)
      `,
            [secondCartId, variantId]
        );

        await postgresPool.query(
            "UPDATE carts SET promotion_code = 'ONCE10' WHERE id = $1",
            [secondCartId]
        );

        await expect(
            checkoutRepository.checkout(
                customer.customerId,
                secondCartId,
                items
            )
        ).rejects.toThrow("Promotion already used by customer");
    });

    it("should allow only one concurrent reservation when maxUses is one", async () => {
        await createPromotion("LAST10", { maxUses: 1 });

        const firstCustomer = await createCustomer();
        const secondCustomer = await createCustomer();

        const firstCart = await createCart(
            firstCustomer.customerId,
            "LAST10"
        );

        const secondCart = await createCart(
            secondCustomer.customerId,
            "LAST10"
        );

        const results = await Promise.allSettled([
            checkoutRepository.checkout(
                firstCustomer.customerId,
                firstCart,
                items
            ),
            checkoutRepository.checkout(
                secondCustomer.customerId,
                secondCart,
                items
            )
        ]);

        expect(
            results.filter((result) => result.status === "fulfilled")
        ).toHaveLength(1);

        expect(
            results.filter((result) => result.status === "rejected")
        ).toHaveLength(1);

        const redemptions = await postgresPool.query(
            `
        SELECT id
        FROM promotion_redemptions
        WHERE status IN ('RESERVED', 'CONSUMED')
      `
        );

        expect(redemptions.rows).toHaveLength(1);
    });

    it("should consume the promotion when payment is approved", async () => {
        await createPromotion("APPROVE10");

        const customer = await createCustomer();
        const cartId = await createCart(
            customer.customerId,
            "APPROVE10"
        );

        const checkout = await checkoutRepository.checkout(
            customer.customerId,
            cartId,
            items
        );

        const payment = await paymentRepository.approve(
            checkout.paymentId,
            customer.userId
        );

        expect(payment.status).toBe("APPROVED");

        const redemption = await getRedemption(checkout.order.id!);
        expect(redemption?.status).toBe("CONSUMED");
    });

    it("should release the promotion when payment is rejected", async () => {
        await createPromotion("REJECT10", { maxUses: 1 });

        const firstCustomer = await createCustomer();
        const firstCart = await createCart(
            firstCustomer.customerId,
            "REJECT10"
        );

        const checkout = await checkoutRepository.checkout(
            firstCustomer.customerId,
            firstCart,
            items
        );

        const payment = await paymentRepository.reject(
            checkout.paymentId,
            firstCustomer.userId
        );

        expect(payment.status).toBe("REJECTED");

        const redemption = await getRedemption(checkout.order.id!);
        expect(redemption?.status).toBe("RELEASED");

        const secondCustomer = await createCustomer();
        const secondCart = await createCart(
            secondCustomer.customerId,
            "REJECT10"
        );

        const secondCheckout = await checkoutRepository.checkout(
            secondCustomer.customerId,
            secondCart,
            items
        );

        expect(secondCheckout.order.discountAmount).toBe(20);
        expect(secondCheckout.order.totalAmount).toBe(180);
    });

    it("should rollback checkout when promotion minimum subtotal is not reached", async () => {
        await createPromotion("MINIMUM10", {
            minSubtotal: 300
        });

        const customer = await createCustomer();
        const cartId = await createCart(
            customer.customerId,
            "MINIMUM10"
        );

        await expect(
            checkoutRepository.checkout(
                customer.customerId,
                cartId,
                items
            )
        ).rejects.toThrow("Minimum subtotal not reached");

        const orders = await postgresPool.query(
            "SELECT id FROM orders"
        );

        const redemptions = await postgresPool.query(
            "SELECT id FROM promotion_redemptions"
        );

        const inventory = await postgresPool.query<{
            reserved_quantity: number;
        }>(
            `
        SELECT reserved_quantity
        FROM inventory_items
        WHERE variant_id = $1
      `,
            [variantId]
        );

        expect(orders.rows).toHaveLength(0);
        expect(redemptions.rows).toHaveLength(0);
        expect(inventory.rows[0].reserved_quantity).toBe(0);
    });

    it("should allow the same customer to reuse a promotion after payment rejection", async () => {
        await createPromotion("RETRY10", {
            maxUses: 1
        });

        const customer = await createCustomer();

        const firstCartId = await createCart(
            customer.customerId,
            "RETRY10"
        );

        const firstCheckout = await checkoutRepository.checkout(
            customer.customerId,
            firstCartId,
            items
        );

        expect(
            (await getRedemption(firstCheckout.order.id!))?.status
        ).toBe("RESERVED");

        await paymentRepository.reject(
            firstCheckout.paymentId,
            customer.userId
        );

        expect(
            (await getRedemption(firstCheckout.order.id!))?.status
        ).toBe("RELEASED");

        const activeCartResult = await postgresPool.query<{
            id: string;
        }>(
            `
      SELECT id
      FROM carts
      WHERE customer_id = $1
        AND status = 'ACTIVE'
    `,
            [customer.customerId]
        );

        const secondCartId = activeCartResult.rows[0].id;

        await postgresPool.query(
            `
      INSERT INTO cart_items (
        cart_id,
        product_variant_id,
        quantity
      )
      VALUES ($1, $2, 2)
    `,
            [secondCartId, variantId]
        );

        await postgresPool.query(
            `
      UPDATE carts
      SET promotion_code = 'RETRY10'
      WHERE id = $1
    `,
            [secondCartId]
        );

        const secondCheckout = await checkoutRepository.checkout(
            customer.customerId,
            secondCartId,
            items
        );

        expect(secondCheckout.order.subtotalAmount).toBe(200);
        expect(secondCheckout.order.discountAmount).toBe(20);
        expect(secondCheckout.order.totalAmount).toBe(180);

        expect(
            (await getRedemption(secondCheckout.order.id!))?.status
        ).toBe("RESERVED");

        const redemptions = await postgresPool.query<{
            status: string;
        }>(
            `
      SELECT status
      FROM promotion_redemptions
      WHERE customer_id = $1
      ORDER BY created_at
    `,
            [customer.customerId]
        );

        expect(redemptions.rows).toHaveLength(2);
        expect(
            redemptions.rows.map((row) => row.status).sort()
        ).toEqual(["RELEASED", "RESERVED"]);
    });
});