import { postgresPool } from "../../../../../../shared/infrastructure/database/postgres.js";
import {
    Promotion,
    type DiscountType
} from "../../../../domain/entities/promotion.js";
import type { PromotionRepository } from "../../../../domain/repositories/promotion-repository.js";

interface PromotionRow {
    id: string;
    code: string;
    discount_type: DiscountType;
    discount_value: string;
    min_subtotal: string;
    starts_at: Date;
    expires_at: Date;
    max_uses: number | null;
    active: boolean;
}

const columns = `
  id,
  code,
  discount_type,
  discount_value,
  min_subtotal,
  starts_at,
  expires_at,
  max_uses,
  active
`;

function toDomain(row: PromotionRow): Promotion {
    return Promotion.restore(row.id, {
        code: row.code,
        discountType: row.discount_type,
        discountValue: Number(row.discount_value),
        minSubtotal: Number(row.min_subtotal),
        startsAt: row.starts_at,
        expiresAt: row.expires_at,
        maxUses: row.max_uses,
        active: row.active
    });
}

export class PostgresPromotionRepository
    implements PromotionRepository {

    async save(promotion: Promotion): Promise<Promotion> {
        const data = promotion.data;

        const result = await postgresPool.query<PromotionRow>(
            `
        INSERT INTO promotions (
          code,
          discount_type,
          discount_value,
          min_subtotal,
          starts_at,
          expires_at,
          max_uses,
          active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING ${columns}
      `,
            [
                data.code,
                data.discountType,
                data.discountValue,
                data.minSubtotal,
                data.startsAt,
                data.expiresAt,
                data.maxUses,
                data.active
            ]
        );

        return toDomain(result.rows[0]);
    }

    async findById(id: string): Promise<Promotion | null> {
        const result = await postgresPool.query<PromotionRow>(
            `SELECT ${columns} FROM promotions WHERE id = $1`,
            [id]
        );

        return result.rows[0] ? toDomain(result.rows[0]) : null;
    }

    async findByCode(code: string): Promise<Promotion | null> {
        const result = await postgresPool.query<PromotionRow>(
            `SELECT ${columns} FROM promotions WHERE code = $1`,
            [code.trim().toUpperCase()]
        );

        return result.rows[0] ? toDomain(result.rows[0]) : null;
    }

    async findAll(): Promise<Promotion[]> {
        const result = await postgresPool.query<PromotionRow>(
            `SELECT ${columns} FROM promotions ORDER BY created_at DESC`
        );

        return result.rows.map(toDomain);
    }

    async update(promotion: Promotion): Promise<void> {
        if (!promotion.id) {
            throw new Error("Promotion id is required");
        }

        const data = promotion.data;

        await postgresPool.query(
            `
        UPDATE promotions
        SET
          code = $2,
          discount_type = $3,
          discount_value = $4,
          min_subtotal = $5,
          starts_at = $6,
          expires_at = $7,
          max_uses = $8,
          active = $9,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
            [
                promotion.id,
                data.code,
                data.discountType,
                data.discountValue,
                data.minSubtotal,
                data.startsAt,
                data.expiresAt,
                data.maxUses,
                data.active
            ]
        );
    }

    async deactivate(id: string): Promise<boolean> {
        const result = await postgresPool.query(
            `
        UPDATE promotions
        SET
          active = false,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `,
            [id]
        );

        return (result.rowCount ?? 0) > 0;
    }
}