import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { ProductRepository } from "../../../../catalog/domain/repositories/product-repository.js";
import { InventoryItem } from "../../../domain/entities/inventory-item.js";
import type { InventoryRepository } from "../../../domain/repositories/inventory-repository.js";

interface CreateInventoryItemInput {
  variantId: string;
  quantity: number;
}

export class CreateInventoryItem {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly productRepository: ProductRepository
  ) {}

  async execute(
    input: CreateInventoryItemInput
  ): Promise<InventoryItem> {
    const product =
      await this.productRepository.findByVariantId(
        input.variantId
      );

    if (!product) {
      throw new AppError("Product variant not found", 404);
    }

    const existingInventory =
      await this.inventoryRepository.findByVariantId(
        input.variantId
      );

    if (existingInventory) {
      throw new AppError(
        "Inventory already exists for this variant",
        409
      );
    }

    const inventoryItem = InventoryItem.create({
      variantId: input.variantId,
      quantity: input.quantity
    });

    return this.inventoryRepository.save(inventoryItem);
  }
}