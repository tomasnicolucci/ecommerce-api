import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder): void => {
    pgm.createType("promotion_discount_type", [
        "PERCENTAGE",
        "FIXED"
    ]);

    pgm.createType("promotion_redemption_status", [
        "RESERVED",
        "CONSUMED",
        "RELEASED"
    ]);

    pgm.createTable("promotions", {
        id: {
            type: "uuid",
            primaryKey: true,
            default: pgm.func("gen_random_uuid()")
        },
        code: {
            type: "varchar(64)",
            notNull: true,
            unique: true
        },
        discount_type: {
            type: "promotion_discount_type",
            notNull: true
        },
        discount_value: {
            type: "numeric(12,2)",
            notNull: true
        },
        min_subtotal: {
            type: "numeric(12,2)",
            notNull: true,
            default: 0
        },
        starts_at: {
            type: "timestamptz",
            notNull: true
        },
        expires_at: {
            type: "timestamptz",
            notNull: true
        },
        max_uses: {
            type: "integer"
        },
        active: {
            type: "boolean",
            notNull: true,
            default: true
        },
        created_at: {
            type: "timestamptz",
            notNull: true,
            default: pgm.func("CURRENT_TIMESTAMP")
        },
        updated_at: {
            type: "timestamptz",
            notNull: true,
            default: pgm.func("CURRENT_TIMESTAMP")
        }
    });

    pgm.addConstraint(
        "promotions",
        "promotions_discount_value_check",
        {
            check: `
        discount_value > 0
        AND (
          discount_type <> 'PERCENTAGE'
          OR discount_value <= 100
        )
      `
        }
    );

    pgm.addConstraint(
        "promotions",
        "promotions_min_subtotal_check",
        {
            check: "min_subtotal >= 0"
        }
    );

    pgm.addConstraint(
        "promotions",
        "promotions_dates_check",
        {
            check: "expires_at > starts_at"
        }
    );

    pgm.addConstraint(
        "promotions",
        "promotions_max_uses_check",
        {
            check: "max_uses IS NULL OR max_uses > 0"
        }
    );

    pgm.createTable("promotion_redemptions", {
        id: {
            type: "uuid",
            primaryKey: true,
            default: pgm.func("gen_random_uuid()")
        },
        promotion_id: {
            type: "uuid",
            notNull: true,
            references: "promotions"
        },
        customer_id: {
            type: "uuid",
            notNull: true,
            references: "customers"
        },
        order_id: {
            type: "uuid",
            notNull: true,
            unique: true,
            references: "orders"
        },
        status: {
            type: "promotion_redemption_status",
            notNull: true
        },
        created_at: {
            type: "timestamptz",
            notNull: true,
            default: pgm.func("CURRENT_TIMESTAMP")
        },
        updated_at: {
            type: "timestamptz",
            notNull: true,
            default: pgm.func("CURRENT_TIMESTAMP")
        }
    });

    pgm.sql(`
    CREATE UNIQUE INDEX
      promotion_redemptions_one_active_per_customer
    ON promotion_redemptions (
      promotion_id,
      customer_id
    )
    WHERE status IN (
      'RESERVED',
      'CONSUMED'
    );
  `);

    pgm.sql(`
    INSERT INTO permissions (name)
    VALUES ('promotions:manage')
    ON CONFLICT (name) DO NOTHING;
  `);

    pgm.sql(`
    INSERT INTO role_permissions (
      role_id,
      permission_id
    )
    SELECT
      r.id,
      p.id
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.name = 'admin'
      AND p.name = 'promotions:manage'
    ON CONFLICT DO NOTHING;
  `);
};

export const down = (pgm: MigrationBuilder): void => {
    pgm.sql(`
    DELETE FROM role_permissions
    WHERE permission_id IN (
      SELECT id
      FROM permissions
      WHERE name = 'promotions:manage'
    );
  `);

    pgm.sql(`
    DELETE FROM permissions
    WHERE name = 'promotions:manage';
  `);

    pgm.dropTable("promotion_redemptions");
    pgm.dropTable("promotions");

    pgm.dropType("promotion_redemption_status");
    pgm.dropType("promotion_discount_type");
};