import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { InventoryRepository } from "../../../../inventory/domain/repositories/inventory-repository.js";
import type { Cart } from "../../../domain/entities/cart.js";
import type { CartRepository } from "../../../domain/repositories/cart-repository.js";

interface UpdateCartItemQuantityInput {
  customerId: string;
  variantId: string;
  quantity: number;
}

export class UpdateCartItemQuantity {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly inventoryRepository: InventoryRepository
  ) {}

  async execute(
    input: UpdateCartItemQuantityInput
  ): Promise<Cart> {
    const cart =
      await this.cartRepository.findActiveByCustomerId(
        input.customerId
      );

    if (!cart || !cart.id) {
      throw new AppError("Active cart not found", 404);
    }

    const cartItem =
      await this.cartRepository.findItemByVariantId(
        cart.id,
        input.variantId
      );

    if (!cartItem) {
      throw new AppError("Cart item not found", 404);
    }

    const inventory =
      await this.inventoryRepository.findByVariantId(
        input.variantId
      );

    if (!inventory) {
      throw new AppError("Inventory not found", 404);
    }

    if (input.quantity > inventory.quantity) {
      throw new AppError("Insufficient stock", 400);
    }

    cartItem.changeQuantity(input.quantity);

    await this.cartRepository.updateItem(cartItem);

    const updatedCart =
      await this.cartRepository.findActiveByCustomerId(
        input.customerId
      );

    if (!updatedCart) {
      throw new Error("Active cart not found");
    }

    return updatedCart;
  }
}