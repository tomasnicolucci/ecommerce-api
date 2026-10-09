import { AppError } from "../../../../shared/domain/errors/app-error.js";
import type { ProductRepository } from "../../../catalog/domain/repositories/product-repository.js";
import type { PromotionRepository } from "../../../promotions/domain/repositories/promotion-repository.js";
import type { Cart } from "../../domain/entities/cart.js";

export interface CartPricing {
    subtotalAmount: number;
    discountAmount: number;
    totalAmount: number;
    currency: string | null;
    promotionCode: string | null;
}

export class CartPricingService {
    constructor(
        private readonly productRepository: ProductRepository,
        private readonly promotionRepository: PromotionRepository
    ) { }

    async calculate(cart: Cart): Promise<CartPricing> {
        let subtotalCents = 0;
        let currency: string | null = null;

        for (const item of cart.items) {
            const product =
                await this.productRepository.findByVariantId(
                    item.variantId
                );

            if (!product || !product.active) {
                throw new AppError(
                    "Product is not available",
                    409
                );
            }

            const variant = product.variants.find(
                (candidate) => candidate.id === item.variantId
            );

            if (!variant || !variant.active) {
                throw new AppError(
                    "Product variant is not available",
                    409
                );
            }

            const price = variant.price;

            if (currency !== null && currency !== price.currency) {
                throw new AppError(
                    "Cart items must use the same currency",
                    400
                );
            }

            currency = price.currency;

            subtotalCents +=
                Math.round(price.amount * 100) * item.quantity;
        }

        const subtotalAmount = subtotalCents / 100;

        if (!cart.promotionCode) {
            return {
                subtotalAmount,
                discountAmount: 0,
                totalAmount: subtotalAmount,
                currency,
                promotionCode: null
            };
        }

        const promotion =
            await this.promotionRepository.findByCode(
                cart.promotionCode
            );

        if (!promotion) {
            throw new AppError(
                "Promotion not found",
                404
            );
        }

        if (cart.items.length === 0) {
            throw new AppError(
                "Cannot apply a promotion to an empty cart",
                400
            );
        }

        const discountAmount =
            promotion.calculateDiscount(subtotalAmount);

        const discountCents = Math.round(discountAmount * 100);

        return {
            subtotalAmount,
            discountAmount,
            totalAmount: (subtotalCents - discountCents) / 100,
            currency,
            promotionCode: promotion.data.code
        };
    }
}