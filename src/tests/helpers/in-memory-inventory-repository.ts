import { InventoryItem } from "../../modules/inventory/domain/entities/inventory-item.js";
import type { InventoryRepository } from "../../modules/inventory/domain/repositories/inventory-repository.js";

export class InMemoryInventoryRepository
  implements InventoryRepository
{
  public inventoryItems: InventoryItem[] = [];

  async findByVariantId(
    variantId: string
  ): Promise<InventoryItem | null> {
    return (
      this.inventoryItems.find(
        (item) => item.variantId === variantId
      ) ?? null
    );
  }

  async save(
    inventoryItem: InventoryItem
  ): Promise<InventoryItem> {
    const savedInventoryItem =
      InventoryItem.restore(
        inventoryItem.id ??
          `inventory-${this.inventoryItems.length + 1}`,
        {
          variantId: inventoryItem.variantId,
          quantity: inventoryItem.quantity,
          reservedQuantity:
            inventoryItem.reservedQuantity
        }
      );

    this.inventoryItems.push(
      savedInventoryItem
    );

    return savedInventoryItem;
  }

  async update(
    inventoryItem: InventoryItem
  ): Promise<void> {
    const index =
      this.inventoryItems.findIndex(
        (item) =>
          item.id === inventoryItem.id
      );

    if (index !== -1) {
      this.inventoryItems[index] =
        inventoryItem;
    }
  }
}