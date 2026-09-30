import { Cart } from "../../../domain/entities/cart.js";
import type { CartRepository } from "../../../domain/repositories/cart-repository.js";

export class GetActiveCart {
  constructor(
    private readonly cartRepository: CartRepository
  ) {}

  async execute(customerId: string): Promise<Cart> {
    const existingCart =
      await this.cartRepository.findActiveByCustomerId(
        customerId
      );

    if (existingCart) {
      return existingCart;
    }

    return this.cartRepository.save(
      Cart.create(customerId)
    );
  }
}