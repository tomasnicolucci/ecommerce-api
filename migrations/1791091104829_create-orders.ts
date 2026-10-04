import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder): void => {
  pgm.createType("order_status", [
    "PENDING",
    "CONFIRMED",
    "CANCELLED"
  ]);

  pgm.createTable("orders", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    customer_id: {
      type: "uuid",
      notNull: true,
      references: "customers"
    },
    cart_id: {
      type: "uuid",
      notNull: true,
      unique: true,
      references: "carts"
    },
    status: {
      type: "order_status",
      notNull: true,
      default: "CONFIRMED"
    },
    total_amount: {
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
    }
  });

  pgm.createTable("order_items", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    order_id: {
      type: "uuid",
      notNull: true,
      references: "orders",
      onDelete: "CASCADE"
    },

    product_id: {
      type: "varchar(255)",
      notNull: true
    },
    product_variant_id: {
      type: "varchar(255)",
      notNull: true
    },

    product_name: {
      type: "varchar(255)",
      notNull: true
    },
    sku: {
      type: "varchar(255)",
      notNull: true
    },

    unit_price: {
      type: "numeric(12, 2)",
      notNull: true
    },
    currency: {
      type: "varchar(3)",
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
    }
  });

  pgm.addConstraint(
    "orders",
    "orders_total_amount_non_negative",
    {
      check: "total_amount >= 0"
    }
  );

  pgm.addConstraint(
    "order_items",
    "order_items_unit_price_non_negative",
    {
      check: "unit_price >= 0"
    }
  );

  pgm.addConstraint(
    "order_items",
    "order_items_quantity_positive",
    {
      check: "quantity > 0"
    }
  );

  pgm.createIndex(
    "orders",
    "customer_id"
  );

  pgm.createIndex(
    "order_items",
    "order_id"
  );
};

export const down = (
  pgm: MigrationBuilder
): void => {
  pgm.dropTable("order_items");
  pgm.dropTable("orders");
  pgm.dropType("order_status");
};