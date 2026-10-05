import { postgresPool } from "../../../../../../shared/infrastructure/database/postgres.js";
import type { InventoryRepository } from "../../../../domain/repositories/inventory-repository.js";
import type { InventoryItem } from "../../../../domain/entities/inventory-item.js";
import { InventoryMapper } from "../mappers/inventory-mapper.js";

export class PostgresInventoryRepository
  implements InventoryRepository {
  async findByVariantId(
    variantId: string
  ): Promise<InventoryItem | null> {
    const result =
      await postgresPool.query(
        `
          SELECT
            id,
            variant_id,
            quantity,
            reserved_quantity
          FROM inventory_items
          WHERE variant_id = $1
        `,
        [variantId]
      );

    if (result.rows.length === 0) {
      return null;
    }

    return InventoryMapper.toDomain(
      result.rows[0]
    );
  }

  async save(
    inventoryItem: InventoryItem
  ): Promise<InventoryItem> {
    const data =
      InventoryMapper.toPersistence(
        inventoryItem
      );

    const result =
      await postgresPool.query(
        `
          INSERT INTO inventory_items (
            variant_id,
            quantity,
            reserved_quantity
          )
          VALUES ($1, $2, $3)
          RETURNING
            id,
            variant_id,
            quantity,
            reserved_quantity
        `,
        [
          data.variantId,
          data.quantity,
          data.reservedQuantity
        ]
      );

    return InventoryMapper.toDomain(
      result.rows[0]
    );
  }

  async update(
    inventoryItem: InventoryItem
  ): Promise<void> {
    const data =
      InventoryMapper.toPersistence(
        inventoryItem
      );

    await postgresPool.query(
      `
        UPDATE inventory_items
        SET
          quantity = $1,
          reserved_quantity = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE variant_id = $3
      `,
      [
        data.quantity,
        data.reservedQuantity,
        data.variantId
      ]
    );
  }
}