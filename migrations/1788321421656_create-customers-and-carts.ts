import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder): void => {
  pgm.createTable("customers", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    user_id: {
      type: "uuid",
      notNull: true,
      unique: true,
      references: "users",
      onDelete: "CASCADE"
    },
    first_name: {
      type: "varchar(100)"
    },
    last_name: {
      type: "varchar(100)"
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

  pgm.createType("cart_status", [
    "ACTIVE",
    "COMPLETED",
    "ABANDONED"
  ]);

  pgm.createTable("carts", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    customer_id: {
      type: "uuid",
      notNull: true,
      references: "customers",
      onDelete: "CASCADE"
    },
    status: {
      type: "cart_status",
      notNull: true,
      default: "ACTIVE"
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP")
    },
    completed_at: {
      type: "timestamptz"
    }
  });

  pgm.sql(`
    CREATE UNIQUE INDEX carts_one_active_per_customer
    ON carts (customer_id)
    WHERE status = 'ACTIVE';
  `);
};

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable("carts");
  pgm.dropType("cart_status");
  pgm.dropTable("customers");
};