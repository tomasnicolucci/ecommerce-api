import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder): void => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    auth_user_id: {
      type: "varchar(255)",
      notNull: true,
      unique: true
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

  pgm.createTable("roles", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    name: {
      type: "varchar(100)",
      notNull: true,
      unique: true
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP")
    }
  });

  pgm.createTable("permissions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    name: {
      type: "varchar(150)",
      notNull: true,
      unique: true
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP")
    }
  });

  pgm.createTable("user_roles", {
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE"
    },
    role_id: {
      type: "uuid",
      notNull: true,
      references: "roles",
      onDelete: "CASCADE"
    }
  });

  pgm.addConstraint("user_roles", "user_roles_pkey", {
    primaryKey: ["user_id", "role_id"]
  });

  pgm.createTable("role_permissions", {
    role_id: {
      type: "uuid",
      notNull: true,
      references: "roles",
      onDelete: "CASCADE"
    },
    permission_id: {
      type: "uuid",
      notNull: true,
      references: "permissions",
      onDelete: "CASCADE"
    }
  });

  pgm.addConstraint("role_permissions", "role_permissions_pkey", {
    primaryKey: ["role_id", "permission_id"]
  });
};

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable("role_permissions");
  pgm.dropTable("user_roles");
  pgm.dropTable("permissions");
  pgm.dropTable("roles");
  pgm.dropTable("users");
};