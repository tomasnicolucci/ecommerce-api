import type { PoolClient } from "pg";
import { postgresPool } from "../../../../../../shared/infrastructure/database/postgres.js";
import { AppError } from "../../../../../../shared/domain/errors/app-error.js";
import { Order } from "../../../../domain/entities/order.js";
import { OrderItem } from "../../../../domain/entities/order-item.js";
import type {
  CheckoutItemSnapshot,
  CheckoutRepository
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
  variant_id: string;
  quantity: number;
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
  ): Promise<Order> {
    const client = await postgresPool.connect();

    try {
      await client.query("BEGIN");

      await this.lockAndValidateCart(
        client,
        customerId,
        cartId,
        items
      );

      await this.lockAndDecreaseInventory(
        client,
        items
      );

      const order =
        await this.createOrder(
          client,
          customerId,
          cartId,
          items
        );

      await this.completeCart(
        client,
        cartId
      );

      await this.createNewActiveCart(
        client,
        customerId
      );

      await client.query("COMMIT");

      return order;
    } catch (error) {
      await client.query("ROLLBACK");
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

    if (cartResult.rows.length === 0) {
      throw new AppError(
        "Cart not found",
        404
      );
    }

    const cart = cartResult.rows[0];

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
            product_variant_id,
            quantity
          FROM cart_items
          WHERE cart_id = $1
          ORDER BY product_variant_id
        `,
        [cartId]
      );

    if (cartItemsResult.rows.length === 0) {
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

    const snapshotByVariant =
      new Map(
        items.map((item) => [
          item.variantId,
          item
        ])
      );

    for (
      const cartItem
      of cartItemsResult.rows
    ) {
      const snapshot =
        snapshotByVariant.get(
          cartItem.product_variant_id
        );

      if (
        !snapshot ||
        snapshot.quantity !==
          cartItem.quantity
      ) {
        throw new AppError(
          "Cart changed during checkout",
          409
        );
      }
    }
  }

  private async lockAndDecreaseInventory(
    client: PoolClient,
    items: CheckoutItemSnapshot[]
  ): Promise<void> {
    const orderedItems =
      [...items].sort(
        (a, b) =>
          a.variantId.localeCompare(
            b.variantId
          )
      );

    for (const item of orderedItems) {
      const inventoryResult =
        await client.query<InventoryRow>(
          `
            SELECT
              variant_id,
              quantity
            FROM inventory_items
            WHERE variant_id = $1
            FOR UPDATE
          `,
          [item.variantId]
        );

      if (
        inventoryResult.rows.length === 0
      ) {
        throw new AppError(
          "Inventory not found for product variant",
          404
        );
      }

      const inventory =
        inventoryResult.rows[0];

      if (
        inventory.quantity <
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
            quantity = quantity - $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE variant_id = $2
        `,
        [
          item.quantity,
          item.variantId
        ]
      );
    }
  }

  private async createOrder(
    client: PoolClient,
    customerId: string,
    cartId: string,
    items: CheckoutItemSnapshot[]
  ): Promise<Order> {
    const domainItems =
      items.map((item) =>
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

    const domainOrder =
      Order.create(
        customerId,
        cartId,
        domainItems
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
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
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
          domainOrder.status,
          domainOrder.totalAmount,
          domainOrder.currency
        ]
      );

    const orderRow =
      orderResult.rows[0];

    const persistedItems: OrderItem[] =
      [];

    for (const item of domainItems) {
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

      const row = result.rows[0];

      persistedItems.push(
        OrderItem.restore(
          row.id,
          {
            productId:
              row.product_id,
            variantId:
              row.product_variant_id,
            productName:
              row.product_name,
            sku:
              row.sku,
            unitPrice:
              Number(row.unit_price),
            currency:
              row.currency,
            quantity:
              row.quantity
          }
        )
      );
    }

    return Order.restore(
      orderRow.id,
      {
        customerId:
          orderRow.customer_id,
        cartId:
          orderRow.cart_id,
        status:
          orderRow.status,
        totalAmount:
          Number(orderRow.total_amount),
        currency:
          orderRow.currency,
        items:
          persistedItems,
        createdAt:
          orderRow.created_at
      }
    );
  }

  private async completeCart(
    client: PoolClient,
    cartId: string
  ): Promise<void> {
    await client.query(
      `
        UPDATE carts
        SET
          status = 'COMPLETED',
          completed_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      [cartId]
    );
  }

  private async createNewActiveCart(
    client: PoolClient,
    customerId: string
  ): Promise<void> {
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
  }
}