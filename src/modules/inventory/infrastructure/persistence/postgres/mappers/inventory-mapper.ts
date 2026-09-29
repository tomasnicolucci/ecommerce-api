import { InventoryItem } from "../../../../domain/entities/inventory-item.js";

interface InventoryRow {
  id: string;
  variant_id: string;
  quantity: number;
}

export class InventoryMapper {
  static toDomain(row: InventoryRow): InventoryItem {
    return InventoryItem.restore(row.id, {
      variantId: row.variant_id,
      quantity: row.quantity
    });
  }

  static toPersistence(inventoryItem: InventoryItem) {
    return {
      variantId: inventoryItem.variantId,
      quantity: inventoryItem.quantity
    };
  }
}