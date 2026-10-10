import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder): void => {
    pgm.addColumns("orders", {
        subtotal_amount: {
            type: "numeric(12,2)"
        },
        discount_amount: {
            type: "numeric(12,2)",
            notNull: true,
            default: 0
        },
        promotion_id: {
            type: "uuid",
            references: "promotions"
        },
        coupon_code: {
            type: "varchar(64)"
        },
        discount_type: {
            type: "promotion_discount_type"
        },
        discount_value: {
            type: "numeric(12,2)"
        }
    });

    pgm.sql(`
    UPDATE orders
    SET subtotal_amount = total_amount
    WHERE subtotal_amount IS NULL
  `);

    pgm.alterColumn("orders", "subtotal_amount", {
        notNull: true
    });

    pgm.addConstraint(
        "orders",
        "orders_promotion_amounts_check",
        {
            check: `
        subtotal_amount >= 0
        AND discount_amount >= 0
        AND total_amount = subtotal_amount - discount_amount
      `
        }
    );

    pgm.addConstraint(
        "orders",
        "orders_promotion_snapshot_check",
        {
            check: `
        (
          promotion_id IS NULL
          AND coupon_code IS NULL
          AND discount_type IS NULL
          AND discount_value IS NULL
          AND discount_amount = 0
        )
        OR
        (
          promotion_id IS NOT NULL
          AND coupon_code IS NOT NULL
          AND discount_type IS NOT NULL
          AND discount_value IS NOT NULL
        )
      `
        }
    );
};

export const down = (pgm: MigrationBuilder): void => {
    pgm.dropConstraint(
        "orders",
        "orders_promotion_snapshot_check"
    );

    pgm.dropConstraint(
        "orders",
        "orders_promotion_amounts_check"
    );

    pgm.dropColumns("orders", [
        "subtotal_amount",
        "discount_amount",
        "promotion_id",
        "coupon_code",
        "discount_type",
        "discount_value"
    ]);
};