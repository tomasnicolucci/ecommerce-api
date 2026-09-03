import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder): void => {
  pgm.createTable("cart_items", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    cart_id: {
      type: "uuid",
      notNull: true,
      references: "carts",
      onDelete: "CASCADE"
    },
    product_variant_id: {
      type: "varchar(255)",
      notNull: true
    },
    quantity: {
      type: "integer",
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

  pgm.addConstraint("cart_items", "cart_items_quantity_positive", {
    check: "quantity > 0"
  });

  pgm.addConstraint("cart_items", "cart_items_cart_variant_unique", {
    unique: ["cart_id", "product_variant_id"]
  });
};

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable("cart_items");
};