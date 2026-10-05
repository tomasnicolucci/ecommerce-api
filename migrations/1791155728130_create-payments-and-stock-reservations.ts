import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder): void => {
    pgm.addColumn("inventory_items", {
        reserved_quantity: {
            type: "integer",
            notNull: true,
            default: 0
        }
    });

    pgm.addConstraint(
        "inventory_items",
        "inventory_items_reserved_quantity_non_negative",
        {
            check: "reserved_quantity >= 0"
        }
    );

    pgm.addConstraint(
        "inventory_items",
        "inventory_items_reserved_not_greater_than_quantity",
        {
            check: "reserved_quantity <= quantity"
        }
    );

    pgm.createType("payment_status", [
        "PENDING",
        "APPROVED",
        "REJECTED"
    ]);

    pgm.createTable("payments", {
        id: {
            type: "uuid",
            primaryKey: true,
            default: pgm.func("gen_random_uuid()")
        },
        order_id: {
            type: "uuid",
            notNull: true,
            unique: true,
            references: "orders"
        },
        status: {
            type: "payment_status",
            notNull: true,
            default: "PENDING"
        },
        amount: {
            type: "numeric(12, 2)",
            notNull: true
        },
        currency: {
            type: "varchar(3)",
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
        },
        resolved_at: {
            type: "timestamptz"
        }
    });

    pgm.addConstraint(
        "payments",
        "payments_amount_non_negative",
        {
            check: "amount >= 0"
        }
    );

    pgm.createIndex(
        "payments",
        "order_id"
    );

    pgm.alterColumn("orders", "status", {
        default: "PENDING"
    });
};

export const down = (
    pgm: MigrationBuilder
): void => {
    pgm.alterColumn("orders", "status", {
        default: "CONFIRMED"
    });

    pgm.dropTable("payments");
    pgm.dropType("payment_status");

    pgm.dropConstraint(
        "inventory_items",
        "inventory_items_reserved_not_greater_than_quantity"
    );

    pgm.dropConstraint(
        "inventory_items",
        "inventory_items_reserved_quantity_non_negative"
    );

    pgm.dropColumn(
        "inventory_items",
        "reserved_quantity"
    );
};