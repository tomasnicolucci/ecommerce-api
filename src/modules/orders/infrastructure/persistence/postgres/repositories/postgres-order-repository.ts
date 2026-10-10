import { postgresPool } from "../../../../../../shared/infrastructure/database/postgres.js";
import { Order, type OrderStatus, type OrderDiscountType } from "../../../../domain/entities/order.js";
import { OrderItem } from "../../../../domain/entities/order-item.js";
import type { OrderRepository } from "../../../../domain/repositories/order-repository.js";

interface OrderRow {
  id: string;
  customer_id: string;
  cart_id: string;
  status: OrderStatus;
  subtotal_amount: string;
  discount_amount: string;
  total_amount: string;
  promotion_id: string | null;
  coupon_code: string | null;
  discount_type: OrderDiscountType | null;
  discount_value: string | null;
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

const orderColumns = `
  id, customer_id, cart_id, status,
  subtotal_amount, discount_amount, total_amount,
  promotion_id, coupon_code, discount_type, discount_value,
  currency, created_at
`;

const itemColumns = `
  id, order_id, product_id, product_variant_id,
  product_name, sku, unit_price, currency, quantity
`;

export class PostgresOrderRepository implements OrderRepository {
  async findByCustomerId(customerId: string): Promise<Order[]> {
    const orders = await postgresPool.query<OrderRow>(
      `
        SELECT ${orderColumns}
        FROM orders
        WHERE customer_id = $1
        ORDER BY created_at DESC
      `,
      [customerId]
    );

    if (orders.rows.length === 0) {
      return [];
    }

    const orderIds = orders.rows.map((order) => order.id);

    const items = await postgresPool.query<OrderItemRow>(
      `
        SELECT ${itemColumns}
        FROM order_items
        WHERE order_id = ANY($1::uuid[])
        ORDER BY created_at ASC
      `,
      [orderIds]
    );

    const itemsByOrder = new Map<string, OrderItem[]>();

    for (const row of items.rows) {
      const current = itemsByOrder.get(row.order_id) ?? [];
      current.push(this.mapItem(row));
      itemsByOrder.set(row.order_id, current);
    }

    return orders.rows.map((row) =>
      this.mapOrder(row, itemsByOrder.get(row.id) ?? [])
    );
  }

  async findByIdAndCustomerId(
    orderId: string,
    customerId: string
  ): Promise<Order | null> {
    const orderResult = await postgresPool.query<OrderRow>(
      `
        SELECT ${orderColumns}
        FROM orders
        WHERE id = $1 AND customer_id = $2
      `,
      [orderId, customerId]
    );

    const row = orderResult.rows[0];

    if (!row) {
      return null;
    }

    const items = await postgresPool.query<OrderItemRow>(
      `
        SELECT ${itemColumns}
        FROM order_items
        WHERE order_id = $1
        ORDER BY created_at ASC
      `,
      [orderId]
    );

    return this.mapOrder(row, items.rows.map((item) => this.mapItem(item)));
  }

  private mapOrder(row: OrderRow, items: OrderItem[]): Order {
    return Order.restore(row.id, {
      customerId: row.customer_id,
      cartId: row.cart_id,
      status: row.status,
      subtotalAmount: Number(row.subtotal_amount),
      discountAmount: Number(row.discount_amount),
      totalAmount: Number(row.total_amount),
      promotionId: row.promotion_id,
      couponCode: row.coupon_code,
      discountType: row.discount_type,
      discountValue:
        row.discount_value === null
          ? null
          : Number(row.discount_value),
      currency: row.currency,
      items,
      createdAt: row.created_at
    });
  }

  private mapItem(row: OrderItemRow): OrderItem {
    return OrderItem.restore(row.id, {
      productId: row.product_id,
      variantId: row.product_variant_id,
      productName: row.product_name,
      sku: row.sku,
      unitPrice: Number(row.unit_price),
      currency: row.currency,
      quantity: row.quantity
    });
  }
}