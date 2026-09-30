import { postgresPool } from "../../../../../../shared/infrastructure/database/postgres.js";
import type {
  EcommerceUser,
  UserRepository
} from "../../../../domain/repositories/user-repository.js";

interface UserRow {
  id: string;
  auth_user_id: string;
}

export class PostgresUserRepository
  implements UserRepository
{
  async findByAuthUserId(
    authUserId: string
  ): Promise<EcommerceUser | null> {
    const result = await postgresPool.query<UserRow>(
      `
        SELECT
          id,
          auth_user_id
        FROM users
        WHERE auth_user_id = $1
        LIMIT 1
      `,
      [authUserId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      id: result.rows[0].id,
      authUserId: result.rows[0].auth_user_id
    };
  }

  async create(
    authUserId: string
  ): Promise<EcommerceUser> {
    const result = await postgresPool.query<UserRow>(
      `
        INSERT INTO users (
          auth_user_id
        )
        VALUES ($1)
        ON CONFLICT (auth_user_id)
        DO UPDATE SET
          updated_at = CURRENT_TIMESTAMP
        RETURNING
          id,
          auth_user_id
      `,
      [authUserId]
    );

    return {
      id: result.rows[0].id,
      authUserId: result.rows[0].auth_user_id
    };
  }
}