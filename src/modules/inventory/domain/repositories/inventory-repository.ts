import type { InventoryItem } from "../entities/inventory-item.js";

export interface InventoryRepository {
  findByVariantId(
    variantId: string
  ): Promise<InventoryItem | null>;

  save(
    inventoryItem: InventoryItem
  ): Promise<InventoryItem>;

  update(
    inventoryItem: InventoryItem
  ): Promise<void>;
}