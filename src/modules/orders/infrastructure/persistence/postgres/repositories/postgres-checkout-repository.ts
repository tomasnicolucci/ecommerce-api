import type { PoolClient } from "pg";
import { postgresPool } from "../../../../../../shared/infrastructure/database/postgres.js";
import { AppError } from "../../../../../../shared/domain/errors/app-error.js";
import { Order } from "../../../../domain/entities/order.js";
import { OrderItem } from "../../../../domain/entities/order-item.js";
import type {
  CheckoutItemSnapshot,
  CheckoutRepository,
  CheckoutResult
} from "../../../../domain/repositories/checkout-repository.js";

interface CartRow {
  id: string;
  customer_id: string;
  status: string;
}

interface CartItemRow {
  variant_id: string;
  quantity: number;
}

interface InventoryRow {
  variant_id: string;
  quantity: number;
  reserved_quantity: number;
}

interface OrderRow {
  id: string;
  customer_id: string;
  cart_id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  total_amount: string;
  currency: string;
  created_at: Date;
}

interface OrderItemRow {
  id: string;
  product_id: string;
  product_variant_id: string;
  product_name: string;
  sku: string;
  unit_price: string;
  currency: string;
  quantity: number;
}

export class PostgresCheckoutRepository
  implements CheckoutRepository
{
  async checkout(
    customerId: string,
    cartId: string,
    items: CheckoutItemSnapshot[]
  ): Promise<CheckoutResult> {
    const client =
      await postgresPool.connect();

    try {
      await client.query("BEGIN");

      const cartResult =
        await client.query<CartRow>(
          `
            SELECT
              id,
              customer_id,
              status
            FROM carts
            WHERE id = $1
            FOR UPDATE
          `,
          [cartId]
        );

      const cart = cartResult.rows[0];

      if (!cart) {
        throw new AppError(
          "Cart not found",
          404
        );
      }

      if (cart.customer_id !== customerId) {
        throw new AppError(
          "Cart not found",
          404
        );
      }

      if (cart.status !== "ACTIVE") {
        throw new AppError(
          "Cart is not active",
          409
        );
      }

      const cartItemsResult =
        await client.query<CartItemRow>(
          `
            SELECT
              variant_id,
              quantity
            FROM cart_items
            WHERE cart_id = $1
            ORDER BY variant_id
          `,
          [cartId]
        );

      if (cartItemsResult.rows.length === 0) {
        throw new AppError(
          "Cart is empty",
          400
        );
      }

      this.validateCartSnapshot(
        cartItemsResult.rows,
        items
      );

      const sortedItems = [...items].sort(
        (a, b) =>
          a.variantId.localeCompare(
            b.variantId
          )
      );

      for (const item of sortedItems) {
        await this.reserveStock(
          client,
          item.variantId,
          item.quantity
        );
      }

      const orderItems = items.map(
        (item) =>
          OrderItem.create({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            sku: item.sku,
            unitPrice: item.unitPrice,
            currency: item.currency,
            quantity: item.quantity
          })
      );

      const order = Order.create(
        customerId,
        cartId,
        orderItems
      );

      const orderResult =
        await client.query<OrderRow>(
          `
            INSERT INTO orders (
              customer_id,
              cart_id,
              status,
              total_amount,
              currency
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
              id,
              customer_id,
              cart_id,
              status,
              total_amount,
              currency,
              created_at
          `,
          [
            order.customerId,
            order.cartId,
            order.status,
            order.totalAmount,
            order.currency
          ]
        );

      const createdOrder =
        orderResult.rows[0];

      const persistedItems: OrderItem[] =
        [];

      for (const item of order.items) {
        const result =
          await client.query<OrderItemRow>(
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
                $1, $2, $3, $4,
                $5, $6, $7, $8
              )
              RETURNING
                id,
                product_id,
                product_variant_id,
                product_name,
                sku,
                unit_price,
                currency,
                quantity
            `,
            [
              createdOrder.id,
              item.productId,
              item.variantId,
              item.productName,
              item.sku,
              item.unitPrice,
              item.currency,
              item.quantity
            ]
          );

        const row = result.rows[0];

        persistedItems.push(
          OrderItem.restore(row.id, {
            productId: row.product_id,
            variantId:
              row.product_variant_id,
            productName:
              row.product_name,
            sku: row.sku,
            unitPrice:
              Number(row.unit_price),
            currency: row.currency,
            quantity: row.quantity
          })
        );
      }

      const paymentResult =
        await client.query<{
          id: string;
        }>(
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
              $2,
              $3
            )
            RETURNING id
          `,
          [
            createdOrder.id,
            order.totalAmount,
            order.currency
          ]
        );

      await client.query(
        `
          UPDATE carts
          SET
            status = 'COMPLETED',
            completed_at =
              CURRENT_TIMESTAMP,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = $1
        `,
        [cartId]
      );

      await client.query(
        `
          INSERT INTO carts (
            customer_id,
            status
          )
          VALUES ($1, 'ACTIVE')
        `,
        [customerId]
      );

      await client.query("COMMIT");

      return {
        order: Order.restore(
          createdOrder.id,
          {
            customerId:
              createdOrder.customer_id,
            cartId:
              createdOrder.cart_id,
            status:
              createdOrder.status,
            totalAmount:
              Number(
                createdOrder.total_amount
              ),
            currency:
              createdOrder.currency,
            items: persistedItems,
            createdAt:
              createdOrder.created_at
          }
        ),
        paymentId:
          paymentResult.rows[0].id
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private validateCartSnapshot(
    cartItems: CartItemRow[],
    snapshots: CheckoutItemSnapshot[]
  ): void {
    if (
      cartItems.length !==
      snapshots.length
    ) {
      throw new AppError(
        "Cart changed during checkout",
        409
      );
    }

    const snapshotMap = new Map(
      snapshots.map((item) => [
        item.variantId,
        item.quantity
      ])
    );

    for (const cartItem of cartItems) {
      if (
        snapshotMap.get(
          cartItem.variant_id
        ) !== cartItem.quantity
      ) {
        throw new AppError(
          "Cart changed during checkout",
          409
        );
      }
    }
  }

  private async reserveStock(
    client: PoolClient,
    variantId: string,
    quantity: number
  ): Promise<void> {
    const result =
      await client.query<InventoryRow>(
        `
          SELECT
            variant_id,
            quantity,
            reserved_quantity
          FROM inventory_items
          WHERE variant_id = $1
          FOR UPDATE
        `,
        [variantId]
      );

    const inventory = result.rows[0];

    if (!inventory) {
      throw new AppError(
        "Inventory item not found",
        404
      );
    }

    const availableQuantity =
      inventory.quantity -
      inventory.reserved_quantity;

    if (availableQuantity < quantity) {
      throw new AppError(
        "Insufficient stock",
        409
      );
    }

    await client.query(
      `
        UPDATE inventory_items
        SET
          reserved_quantity =
            reserved_quantity + $1,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE variant_id = $2
      `,
      [quantity, variantId]
    );
  }
}