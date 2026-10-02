import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder): void => {
  pgm.sql(`
    INSERT INTO roles (name)
    VALUES ('admin'), ('customer')
    ON CONFLICT (name) DO NOTHING;
  `);

  pgm.sql(`
    INSERT INTO permissions (name)
    VALUES
      ('catalog:manage'),
      ('inventory:manage')
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
      AND p.name IN (
        'catalog:manage',
        'inventory:manage'
      )
    ON CONFLICT DO NOTHING;
  `);
};

export const down = (pgm: MigrationBuilder): void => {
  pgm.sql(`
    DELETE FROM role_permissions
    WHERE role_id = (
      SELECT id
      FROM roles
      WHERE name = 'admin'
    )
    AND permission_id IN (
      SELECT id
      FROM permissions
      WHERE name IN (
        'catalog:manage',
        'inventory:manage'
      )
    );
  `);

  pgm.sql(`
    DELETE FROM permissions
    WHERE name IN (
      'catalog:manage',
      'inventory:manage'
    );
  `);

  pgm.sql(`
    DELETE FROM roles
    WHERE name IN ('admin', 'customer');
  `);
};