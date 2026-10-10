import type { PoolClient } from "pg";
import { postgresPool } from "../../../../../../shared/infrastructure/database/postgres.js";
import { AppError } from "../../../../../../shared/domain/errors/app-error.js";
import { Payment } from "../../../../domain/entities/payment.js";
import type { PaymentRepository } from "../../../../domain/repositories/payment-repository.js";

interface PaymentRow {
    id: string;
    order_id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    amount: string;
    currency: string;
    created_at: Date;
    resolved_at: Date | null;
}

interface PaymentContextRow extends PaymentRow {
    order_status: "PENDING" | "CONFIRMED" | "CANCELLED";
    promotion_id: string | null;
}

interface OrderItemRow {
    product_variant_id: string;
    quantity: number;
}

export class PostgresPaymentRepository implements PaymentRepository {
    async findById(id: string, userId: string): Promise<Payment | null> {
        const result = await postgresPool.query<PaymentRow>(
            `
        SELECT
          p.id, p.order_id, p.status, p.amount,
          p.currency, p.created_at, p.resolved_at
        FROM payments p
        INNER JOIN orders o ON o.id = p.order_id
        INNER JOIN customers c ON c.id = o.customer_id
        WHERE p.id = $1 AND c.user_id = $2
      `,
            [id, userId]
        );

        return result.rows[0] ? this.toDomain(result.rows[0]) : null;
    }

    async approve(id: string, userId: string): Promise<Payment> {
        const client = await postgresPool.connect();

        try {
            await client.query("BEGIN");

            const payment = await this.getPaymentForUpdate(client, id, userId);

            if (!payment) {
                throw new AppError("Payment not found", 404);
            }

            this.ensurePending(payment);

            const items = await this.getOrderItems(client, payment.order_id);

            const sortedItems = [...items].sort((a, b) =>
                a.product_variant_id.localeCompare(b.product_variant_id)
            );

            for (const item of sortedItems) {
                const result = await client.query<{
                    quantity: number;
                    reserved_quantity: number;
                }>(
                    `
            SELECT quantity, reserved_quantity
            FROM inventory_items
            WHERE variant_id = $1
            FOR UPDATE
          `,
                    [item.product_variant_id]
                );

                const inventory = result.rows[0];

                if (!inventory) {
                    throw new AppError("Inventory item not found", 404);
                }

                if (inventory.reserved_quantity < item.quantity) {
                    throw new AppError("Invalid stock reservation", 409);
                }

                if (inventory.quantity < item.quantity) {
                    throw new AppError("Insufficient stock", 409);
                }

                await client.query(
                    `
            UPDATE inventory_items
            SET
              quantity = quantity - $1,
              reserved_quantity = reserved_quantity - $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE variant_id = $2
          `,
                    [item.quantity, item.product_variant_id]
                );
            }

            await this.resolvePromotion(
                client,
                payment,
                "CONSUMED"
            );

            await client.query(
                `
          UPDATE orders
          SET status = 'CONFIRMED',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `,
                [payment.order_id]
            );

            const result = await client.query<PaymentRow>(
                `
          UPDATE payments
          SET status = 'APPROVED',
              resolved_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING
            id, order_id, status, amount,
            currency, created_at, resolved_at
        `,
                [id]
            );

            await client.query("COMMIT");

            return this.toDomain(result.rows[0]);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async reject(id: string, userId: string): Promise<Payment> {
        const client = await postgresPool.connect();

        try {
            await client.query("BEGIN");

            const payment = await this.getPaymentForUpdate(client, id, userId);

            if (!payment) {
                throw new AppError("Payment not found", 404);
            }

            this.ensurePending(payment);

            const items = await this.getOrderItems(client, payment.order_id);

            const sortedItems = [...items].sort((a, b) =>
                a.product_variant_id.localeCompare(b.product_variant_id)
            );

            for (const item of sortedItems) {
                const result = await client.query<{
                    reserved_quantity: number;
                }>(
                    `
            SELECT reserved_quantity
            FROM inventory_items
            WHERE variant_id = $1
            FOR UPDATE
          `,
                    [item.product_variant_id]
                );

                const inventory = result.rows[0];

                if (!inventory) {
                    throw new AppError("Inventory item not found", 404);
                }

                if (inventory.reserved_quantity < item.quantity) {
                    throw new AppError("Invalid stock reservation", 409);
                }

                await client.query(
                    `
            UPDATE inventory_items
            SET
              reserved_quantity = reserved_quantity - $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE variant_id = $2
          `,
                    [item.quantity, item.product_variant_id]
                );
            }

            await this.resolvePromotion(
                client,
                payment,
                "RELEASED"
            );

            await client.query(
                `
          UPDATE orders
          SET status = 'CANCELLED',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `,
                [payment.order_id]
            );

            const result = await client.query<PaymentRow>(
                `
          UPDATE payments
          SET status = 'REJECTED',
              resolved_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING
            id, order_id, status, amount,
            currency, created_at, resolved_at
        `,
                [id]
            );

            await client.query("COMMIT");

            return this.toDomain(result.rows[0]);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    private ensurePending(payment: PaymentContextRow): void {
        if (payment.status !== "PENDING") {
            throw new AppError("Payment is already resolved", 409);
        }

        if (payment.order_status !== "PENDING") {
            throw new AppError("Order is not pending", 409);
        }
    }

    private async resolvePromotion(
        client: PoolClient,
        payment: PaymentContextRow,
        targetStatus: "CONSUMED" | "RELEASED"
    ): Promise<void> {
        if (!payment.promotion_id) {
            return;
        }

        const result = await client.query(
            `
        UPDATE promotion_redemptions
        SET status = $3::promotion_redemption_status,
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $1
          AND promotion_id = $2
          AND status = 'RESERVED'
        RETURNING id
      `,
            [
                payment.order_id,
                payment.promotion_id,
                targetStatus
            ]
        );

        if (result.rowCount !== 1) {
            throw new AppError(
                "Invalid promotion reservation",
                409
            );
        }
    }

    private async getPaymentForUpdate(
        client: PoolClient,
        id: string,
        userId: string
    ): Promise<PaymentContextRow | null> {
        const result = await client.query<PaymentContextRow>(
            `
        SELECT
          p.id, p.order_id, p.status, p.amount,
          p.currency, p.created_at, p.resolved_at,
          o.status AS order_status,
          o.promotion_id
        FROM payments p
        INNER JOIN orders o ON o.id = p.order_id
        INNER JOIN customers c ON c.id = o.customer_id
        WHERE p.id = $1 AND c.user_id = $2
        FOR UPDATE OF p, o
      `,
            [id, userId]
        );

        return result.rows[0] ?? null;
    }

    private async getOrderItems(
        client: PoolClient,
        orderId: string
    ): Promise<OrderItemRow[]> {
        const result = await client.query<OrderItemRow>(
            `
        SELECT product_variant_id, quantity
        FROM order_items
        WHERE order_id = $1
      `,
            [orderId]
        );

        return result.rows;
    }

    private toDomain(row: PaymentRow): Payment {
        return Payment.restore(row.id, {
            orderId: row.order_id,
            status: row.status,
            amount: Number(row.amount),
            currency: row.currency,
            createdAt: row.created_at,
            resolvedAt: row.resolved_at
        });
    }
}