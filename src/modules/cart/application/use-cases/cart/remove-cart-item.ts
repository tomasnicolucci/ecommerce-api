import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { Cart } from "../../../domain/entities/cart.js";
import type { CartRepository } from "../../../domain/repositories/cart-repository.js";

interface RemoveCartItemInput {
  customerId: string;
  variantId: string;
}

export class RemoveCartItem {
  constructor(
    private readonly cartRepository: CartRepository
  ) {}

  async execute(
    input: RemoveCartItemInput
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

    await this.cartRepository.removeItem(
      cart.id,
      input.variantId
    );

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