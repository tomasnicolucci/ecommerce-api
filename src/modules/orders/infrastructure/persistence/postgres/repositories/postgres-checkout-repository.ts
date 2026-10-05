import type {
  PoolClient
} from "pg";
import { AppError } from "../../../../../../shared/domain/errors/app-error.js";
import { postgresPool } from "../../../../../../shared/infrastructure/database/postgres.js";
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
  product_variant_id: string;
  quantity: number;
}

interface InventoryRow {
  quantity: number;
  reserved_quantity: number;
}

interface OrderRow {
  id: string;
  customer_id: string;
  cart_id: string;
  status:
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED";
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
  implements CheckoutRepository {
  async checkout(
    customerId: string,
    cartId: string,
    items: CheckoutItemSnapshot[]
  ): Promise<CheckoutResult> {
    const client =
      await postgresPool.connect();

    try {
      await client.query("BEGIN");

      await this.lockAndValidateCart(
        client,
        customerId,
        cartId,
        items
      );

      const sortedItems =
        [...items].sort(
          (a, b) =>
            a.variantId.localeCompare(
              b.variantId
            )
        );

      await this.reserveInventory(
        client,
        sortedItems
      );

      const totalAmount =
        items.reduce(
          (total, item) =>
            total +
            item.unitPrice *
            item.quantity,
          0
        );

      const currency =
        items[0].currency;

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
            VALUES (
              $1,
              $2,
              'PENDING',
              $3,
              $4
            )
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
            customerId,
            cartId,
            totalAmount,
            currency
          ]
        );

      const orderRow =
        orderResult.rows[0];

      const orderItems: OrderItem[] =
        [];

      for (const item of items) {
        const itemResult =
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
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8
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
              orderRow.id,
              item.productId,
              item.variantId,
              item.productName,
              item.sku,
              item.unitPrice,
              item.currency,
              item.quantity
            ]
          );

        const row =
          itemResult.rows[0];

        orderItems.push(
          OrderItem.restore(
            row.id,
            {
              productId:
                row.product_id,
              variantId:
                row.product_variant_id,
              productName:
                row.product_name,
              sku: row.sku,
              unitPrice:
                Number(
                  row.unit_price
                ),
              currency:
                row.currency,
              quantity:
                row.quantity
            }
          )
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
            orderRow.id,
            totalAmount,
            currency
          ]
        );

      await client.query(
        `
          UPDATE carts
          SET
            status = 'COMPLETED',
            completed_at =
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
          VALUES (
            $1,
            'ACTIVE'
          )
        `,
        [customerId]
      );

      await client.query("COMMIT");

      const order =
        Order.restore(
          orderRow.id,
          {
            customerId:
              orderRow.customer_id,
            cartId:
              orderRow.cart_id,
            status:
              orderRow.status,
            totalAmount:
              Number(
                orderRow.total_amount
              ),
            currency:
              orderRow.currency,
            items: orderItems,
            createdAt:
              orderRow.created_at
          }
        );

      return {
        order,
        paymentId:
          paymentResult.rows[0].id
      };
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      throw error;
    } finally {
      client.release();
    }
  }

  private async lockAndValidateCart(
    client: PoolClient,
    customerId: string,
    cartId: string,
    items: CheckoutItemSnapshot[]
  ): Promise<void> {
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

    const cart =
      cartResult.rows[0];

    if (!cart) {
      throw new AppError(
        "Cart not found",
        404
      );
    }

    if (
      cart.customer_id !==
      customerId
    ) {
      throw new AppError(
        "Cart not found",
        404
      );
    }

    if (
      cart.status !== "ACTIVE"
    ) {
      throw new AppError(
        "Cart is not active",
        409
      );
    }

    const cartItemsResult =
      await client.query<CartItemRow>(
        `
          SELECT
            product_variant_id,
            quantity
          FROM cart_items
          WHERE cart_id = $1
          ORDER BY product_variant_id
        `,
        [cartId]
      );

    if (
      cartItemsResult.rows.length ===
      0
    ) {
      throw new AppError(
        "Cart is empty",
        400
      );
    }

    if (
      cartItemsResult.rows.length !==
      items.length
    ) {
      throw new AppError(
        "Cart changed during checkout",
        409
      );
    }

    const expectedItems =
      [...items].sort(
        (a, b) =>
          a.variantId.localeCompare(
            b.variantId
          )
      );

    for (
      let index = 0;
      index <
      expectedItems.length;
      index++
    ) {
      const expected =
        expectedItems[index];

      const current =
        cartItemsResult.rows[index];

      if (
        current.product_variant_id !==
        expected.variantId ||
        current.quantity !==
        expected.quantity
      ) {
        throw new AppError(
          "Cart changed during checkout",
          409
        );
      }
    }
  }

  private async reserveInventory(
    client: PoolClient,
    items: CheckoutItemSnapshot[]
  ): Promise<void> {
    for (const item of items) {
      const inventoryResult =
        await client.query<InventoryRow>(
          `
            SELECT
              quantity,
              reserved_quantity
            FROM inventory_items
            WHERE variant_id = $1
            FOR UPDATE
          `,
          [item.variantId]
        );

      const inventory =
        inventoryResult.rows[0];

      if (!inventory) {
        throw new AppError(
          "Inventory item not found",
          404
        );
      }

      const availableQuantity =
        inventory.quantity -
        inventory.reserved_quantity;

      if (
        availableQuantity <
        item.quantity
      ) {
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
        [
          item.quantity,
          item.variantId
        ]
      );
    }
  }
}