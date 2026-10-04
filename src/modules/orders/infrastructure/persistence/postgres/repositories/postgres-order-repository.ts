import { postgresPool } from "../../../../../../shared/infrastructure/database/postgres.js";
import { Order } from "../../../../domain/entities/order.js";
import { OrderItem } from "../../../../domain/entities/order-item.js";
import type { OrderStatus } from "../../../../domain/entities/order.js";
import type { OrderRepository } from "../../../../domain/repositories/order-repository.js";

interface OrderRow {
  id: string;
  customer_id: string;
  cart_id: string;
  status: OrderStatus;
  total_amount: string;
  currency: string;
  created_at: Date;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_variant_id: string;
  product_name: string;
  sku: string;
  unit_price: string;
  currency: string;
  quantity: number;
}

export class PostgresOrderRepository
  implements OrderRepository
{
  async findByCustomerId(
    customerId: string
  ): Promise<Order[]> {
    const orderResult =
      await postgresPool.query<OrderRow>(
        `
          SELECT
            id,
            customer_id,
            cart_id,
            status,
            total_amount,
            currency,
            created_at
          FROM orders
          WHERE customer_id = $1
          ORDER BY created_at DESC
        `,
        [customerId]
      );

    if (orderResult.rows.length === 0) {
      return [];
    }

    const orderIds =
      orderResult.rows.map(
        (order) => order.id
      );

    const itemsResult =
      await postgresPool.query<OrderItemRow>(
        `
          SELECT
            id,
            order_id,
            product_id,
            product_variant_id,
            product_name,
            sku,
            unit_price,
            currency,
            quantity
          FROM order_items
          WHERE order_id = ANY($1::uuid[])
          ORDER BY created_at ASC
        `,
        [orderIds]
      );

    const itemsByOrder =
      new Map<string, OrderItem[]>();

    for (const row of itemsResult.rows) {
      const items =
        itemsByOrder.get(row.order_id) ?? [];

      items.push(
        this.mapItem(row)
      );

      itemsByOrder.set(
        row.order_id,
        items
      );
    }

    return orderResult.rows.map(
      (row) =>
        this.mapOrder(
          row,
          itemsByOrder.get(row.id) ?? []
        )
    );
  }

  async findByIdAndCustomerId(
    orderId: string,
    customerId: string
  ): Promise<Order | null> {
    const orderResult =
      await postgresPool.query<OrderRow>(
        `
          SELECT
            id,
            customer_id,
            cart_id,
            status,
            total_amount,
            currency,
            created_at
          FROM orders
          WHERE id = $1
            AND customer_id = $2
        `,
        [
          orderId,
          customerId
        ]
      );

    if (orderResult.rows.length === 0) {
      return null;
    }

    const itemsResult =
      await postgresPool.query<OrderItemRow>(
        `
          SELECT
            id,
            order_id,
            product_id,
            product_variant_id,
            product_name,
            sku,
            unit_price,
            currency,
            quantity
          FROM order_items
          WHERE order_id = $1
          ORDER BY created_at ASC
        `,
        [orderId]
      );

    return this.mapOrder(
      orderResult.rows[0],
      itemsResult.rows.map(
        (row) => this.mapItem(row)
      )
    );
  }

  private mapOrder(
    row: OrderRow,
    items: OrderItem[]
  ): Order {
    return Order.restore(
      row.id,
      {
        customerId:
          row.customer_id,
        cartId:
          row.cart_id,
        status:
          row.status,
        totalAmount:
          Number(row.total_amount),
        currency:
          row.currency,
        items,
        createdAt:
          row.created_at
      }
    );
  }

  private mapItem(
    row: OrderItemRow
  ): OrderItem {
    return OrderItem.restore(
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
    );
  }
}