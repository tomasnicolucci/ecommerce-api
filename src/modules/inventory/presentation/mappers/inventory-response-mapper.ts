import type { InventoryItem } from "../../domain/entities/inventory-item.js";

export class InventoryResponseMapper {
  static toResponse(
    inventoryItem: InventoryItem
  ) {
    return {
      id: inventoryItem.id,
      variantId:
        inventoryItem.variantId,
      quantity:
        inventoryItem.quantity,
      reservedQuantity:
        inventoryItem.reservedQuantity,
      availableQuantity:
        inventoryItem.availableQuantity
    };
  }
}