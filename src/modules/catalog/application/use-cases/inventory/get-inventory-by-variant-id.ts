import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { InventoryItem } from "../../../domain/entities/inventory-item.js";
import type { InventoryRepository } from "../../../domain/repositories/inventory-repository.js";

export class GetInventoryByVariantId {
  constructor(
    private readonly inventoryRepository: InventoryRepository
  ) {}

  async execute(
    variantId: string
  ): Promise<InventoryItem> {
    const inventoryItem =
      await this.inventoryRepository.findByVariantId(
        variantId
      );

    if (!inventoryItem) {
      throw new AppError("Inventory not found", 404);
    }

    return inventoryItem;
  }
}