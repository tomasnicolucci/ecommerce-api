import { postgresPool } from "../../../../shared/infrastructure/database/postgres.js";

export interface SyncAuthUserResult {
    userId: string;
    customerId: string;
    cartId: string;
}

export class SyncAuthUser {
    async execute(authUserId: string): Promise<SyncAuthUserResult> {
        const client = await postgresPool.connect();

        try {
            await client.query("BEGIN");

            const userResult = await client.query<{ id: string }>(
                `
          INSERT INTO users (auth_user_id)
          VALUES ($1)
          ON CONFLICT (auth_user_id)
          DO UPDATE SET auth_user_id = EXCLUDED.auth_user_id
          RETURNING id
        `,
                [authUserId]
            );

            const userId = userResult.rows[0].id;

            await client.query(
                `
          INSERT INTO user_roles (user_id, role_id)
          SELECT $1, id
          FROM roles
          WHERE name = 'customer'
          ON CONFLICT DO NOTHING
        `,
                [userId]
            );

            const customerResult = await client.query<{ id: string }>(
                `
          INSERT INTO customers (user_id)
          VALUES ($1)
          ON CONFLICT (user_id)
          DO UPDATE SET user_id = EXCLUDED.user_id
          RETURNING id
        `,
                [userId]
            );

            const customerId = customerResult.rows[0].id;

            const existingCart = await client.query<{ id: string }>(
                `
          SELECT id
          FROM carts
          WHERE customer_id = $1
            AND status = 'ACTIVE'
          LIMIT 1
        `,
                [customerId]
            );

            let cartId: string;

            if (existingCart.rows.length > 0) {
                cartId = existingCart.rows[0].id;
            } else {
                const cartResult = await client.query<{ id: string }>(
                    `
            INSERT INTO carts (customer_id, status)
            VALUES ($1, 'ACTIVE')
            ON CONFLICT (customer_id)
              WHERE status = 'ACTIVE'
            DO UPDATE SET customer_id = EXCLUDED.customer_id
            RETURNING id
          `,
                    [customerId]
                );

                cartId = cartResult.rows[0].id;
            }

            await client.query("COMMIT");

            return {
                userId,
                customerId,
                cartId
            };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}