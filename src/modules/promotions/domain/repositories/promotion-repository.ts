import type { Promotion } from "../entities/promotion.js";

export interface PromotionRepository {
    save(promotion: Promotion): Promise<Promotion>;

    findById(id: string): Promise<Promotion | null>;

    findByCode(code: string): Promise<Promotion | null>;

    findAll(): Promise<Promotion[]>;

    update(promotion: Promotion): Promise<void>;

    deactivate(id: string): Promise<boolean>;
}