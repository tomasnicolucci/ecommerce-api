import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { Cart } from "../../../domain/entities/cart.js";
import type { CartRepository } from "../../../domain/repositories/cart-repository.js";

export class RemoveCartPromotion {
    constructor(
        private readonly cartRepository: CartRepository
    ) { }

    async execute(customerId: string): Promise<Cart> {
        const cart =
            await this.cartRepository.findActiveByCustomerId(
                customerId
            );

        if (!cart || !cart.id) {
            throw new AppError(
                "Active cart not found",
                404
            );
        }

        await this.cartRepository.setPromotionCode(
            cart.id,
            null
        );

        const updatedCart =
            await this.cartRepository.findActiveByCustomerId(
                customerId
            );

        if (!updatedCart) {
            throw new AppError(
                "Active cart not found",
                404
            );
        }

        return updatedCart;
    }
}