import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder): void => {
  pgm.createTable("inventory_items", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    variant_id: {
      type: "varchar(255)",
      notNull: true,
      unique: true
    },
    quantity: {
      type: "integer",
      notNull: true,
      default: 0
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
    "inventory_items",
    "inventory_items_quantity_non_negative",
    {
      check: "quantity >= 0"
    }
  );
};

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable("inventory_items");
};