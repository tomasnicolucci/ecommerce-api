import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { InventoryItem } from "../../../domain/entities/inventory-item.js";
import type { InventoryRepository } from "../../../domain/repositories/inventory-repository.js";

export class AdjustStock {
  constructor(
    private readonly inventoryRepository: InventoryRepository
  ) {}

  async execute(
    variantId: string,
    quantity: number
  ): Promise<InventoryItem> {
    const inventoryItem =
      await this.inventoryRepository.findByVariantId(
        variantId
      );

    if (!inventoryItem) {
      throw new AppError("Inventory not found", 404);
    }

    if (inventoryItem.quantity + quantity < 0) {
      throw new AppError("Insufficient stock", 400);
    }

    inventoryItem.adjustQuantity(quantity);

    await this.inventoryRepository.update(
      inventoryItem
    );

    return inventoryItem;
  }
}