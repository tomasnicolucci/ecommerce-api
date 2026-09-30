import { postgresPool } from "../../../../../../shared/infrastructure/database/postgres.js";
import type { Cart } from "../../../../domain/entities/cart.js";
import type { CartItem } from "../../../../domain/entities/cart-item.js";
import type { CartRepository } from "../../../../domain/repositories/cart-repository.js";
import { CartMapper } from "../mappers/cart-mapper.js";

export class PostgresCartRepository
  implements CartRepository
{
  async findActiveByCustomerId(
    customerId: string
  ): Promise<Cart | null> {
    const cartResult = await postgresPool.query(
      `
        SELECT id, customer_id, status
        FROM carts
        WHERE customer_id = $1
          AND status = 'ACTIVE'
        LIMIT 1
      `,
      [customerId]
    );

    if (cartResult.rows.length === 0) {
      return null;
    }

    const cartRow = cartResult.rows[0];

    const itemsResult = await postgresPool.query(
      `
        SELECT
          id,
          cart_id,
          product_variant_id,
          quantity
        FROM cart_items
        WHERE cart_id = $1
        ORDER BY created_at ASC
      `,
      [cartRow.id]
    );

    return CartMapper.toDomain(
      cartRow,
      itemsResult.rows
    );
  }

  async save(cart: Cart): Promise<Cart> {
    const result = await postgresPool.query(
      `
        INSERT INTO carts (
          customer_id,
          status
        )
        VALUES ($1, $2)
        RETURNING id, customer_id, status
      `,
      [cart.customerId, cart.status]
    );

    return CartMapper.toDomain(
      result.rows[0],
      []
    );
  }

  async findItemByVariantId(
    cartId: string,
    variantId: string
  ): Promise<CartItem | null> {
    const result = await postgresPool.query(
      `
        SELECT
          id,
          cart_id,
          product_variant_id,
          quantity
        FROM cart_items
        WHERE cart_id = $1
          AND product_variant_id = $2
        LIMIT 1
      `,
      [cartId, variantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return CartMapper.itemToDomain(
      result.rows[0]
    );
  }

  async addItem(
    cartItem: CartItem
  ): Promise<CartItem> {
    const result = await postgresPool.query(
      `
        INSERT INTO cart_items (
          cart_id,
          product_variant_id,
          quantity
        )
        VALUES ($1, $2, $3)
        RETURNING
          id,
          cart_id,
          product_variant_id,
          quantity
      `,
      [
        cartItem.cartId,
        cartItem.variantId,
        cartItem.quantity
      ]
    );

    return CartMapper.itemToDomain(
      result.rows[0]
    );
  }

  async updateItem(
    cartItem: CartItem
  ): Promise<void> {
    await postgresPool.query(
      `
        UPDATE cart_items
        SET quantity = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
      [
        cartItem.quantity,
        cartItem.id
      ]
    );
  }

  async removeItem(
    cartId: string,
    variantId: string
  ): Promise<void> {
    await postgresPool.query(
      `
        DELETE FROM cart_items
        WHERE cart_id = $1
          AND product_variant_id = $2
      `,
      [cartId, variantId]
    );
  }
}