import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { PromotionRepository } from "../../../../promotions/domain/repositories/promotion-repository.js";
import type { CartRepository } from "../../../domain/repositories/cart-repository.js";
import type { CartPricingService } from "../../services/cart-pricing-service.js";
import type { Cart } from "../../../domain/entities/cart.js";

export class ApplyCartPromotion {
    constructor(
        private readonly cartRepository: CartRepository,
        private readonly promotionRepository: PromotionRepository,
        private readonly pricingService: CartPricingService
    ) { }

    async execute(
        customerId: string,
        code: string
    ): Promise<Cart> {
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

        if (cart.items.length === 0) {
            throw new AppError(
                "Cannot apply a promotion to an empty cart",
                400
            );
        }

        const normalizedCode = code.trim().toUpperCase();

        if (
            cart.promotionCode &&
            cart.promotionCode !== normalizedCode
        ) {
            throw new AppError(
                "Remove the current promotion before applying another",
                409
            );
        }

        const promotion =
            await this.promotionRepository.findByCode(
                normalizedCode
            );

        if (!promotion) {
            throw new AppError(
                "Promotion not found",
                404
            );
        }

        const pricing = await this.pricingService.calculate(
            cart
        );

        promotion.calculateDiscount(pricing.subtotalAmount);

        await this.cartRepository.setPromotionCode(
            cart.id,
            normalizedCode
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