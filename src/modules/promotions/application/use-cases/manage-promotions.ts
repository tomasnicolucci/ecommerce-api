import { AppError } from "../../../../shared/domain/errors/app-error.js";
import {
    Promotion,
    type PromotionProps
} from "../../domain/entities/promotion.js";
import type { PromotionRepository } from "../../domain/repositories/promotion-repository.js";

export class ManagePromotions {
    constructor(
        private readonly repository: PromotionRepository
    ) { }

    async create(input: PromotionProps): Promise<Promotion> {
        const promotion = Promotion.create(input);

        if (await this.repository.findByCode(promotion.data.code)) {
            throw new AppError(
                "Promotion code already exists",
                409
            );
        }

        return this.repository.save(promotion);
    }

    async list(): Promise<Promotion[]> {
        return this.repository.findAll();
    }

    async get(id: string): Promise<Promotion> {
        const promotion = await this.repository.findById(id);

        if (!promotion) {
            throw new AppError("Promotion not found", 404);
        }

        return promotion;
    }

    async update(
        id: string,
        changes: Partial<PromotionProps>
    ): Promise<Promotion> {
        const promotion = await this.get(id);

        const nextCode = changes.code?.trim().toUpperCase();

        if (
            nextCode &&
            nextCode !== promotion.data.code &&
            await this.repository.findByCode(nextCode)
        ) {
            throw new AppError(
                "Promotion code already exists",
                409
            );
        }

        promotion.update(changes);

        await this.repository.update(promotion);

        return promotion;
    }

    async deactivate(id: string): Promise<void> {
        const updated = await this.repository.deactivate(id);

        if (!updated) {
            throw new AppError("Promotion not found", 404);
        }
    }
}