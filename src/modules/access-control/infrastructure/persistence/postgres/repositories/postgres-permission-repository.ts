import { postgresPool } from "../../../../../../shared/infrastructure/database/postgres.js";
import type { PermissionRepository } from "../../../../domain/repositories/permission-repository.js";

export class PostgresPermissionRepository
  implements PermissionRepository
{
  async hasPermission(
    userId: string,
    permission: string
  ): Promise<boolean> {
    const result = await postgresPool.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM user_roles ur
          INNER JOIN role_permissions rp
            ON rp.role_id = ur.role_id
          INNER JOIN permissions p
            ON p.id = rp.permission_id
          WHERE ur.user_id = $1
            AND p.name = $2
        ) AS allowed
      `,
      [userId, permission]
    );

    return result.rows[0].allowed === true;
  }
}