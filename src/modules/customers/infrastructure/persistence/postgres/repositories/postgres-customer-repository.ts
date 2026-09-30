import { postgresPool } from "../../../../../../shared/infrastructure/database/postgres.js";
import type { Customer } from "../../../../domain/entities/customer.js";
import type { CustomerRepository } from "../../../../domain/repositories/customer-repository.js";
import { CustomerMapper } from "../mappers/customer-mapper.js";

export class PostgresCustomerRepository
  implements CustomerRepository
{
  async findById(
    id: string
  ): Promise<Customer | null> {
    const result = await postgresPool.query(
      `
        SELECT
          id,
          user_id,
          first_name,
          last_name
        FROM customers
        WHERE id = $1
        LIMIT 1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return CustomerMapper.toDomain(result.rows[0]);
  }

  async findByUserId(
    userId: string
  ): Promise<Customer | null> {
    const result = await postgresPool.query(
      `
        SELECT
          id,
          user_id,
          first_name,
          last_name
        FROM customers
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return CustomerMapper.toDomain(result.rows[0]);
  }

  async userExists(userId: string): Promise<boolean> {
    const result = await postgresPool.query(
      `
        SELECT 1
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId]
    );

    return result.rows.length > 0;
  }

  async save(
    customer: Customer
  ): Promise<Customer> {
    const result = await postgresPool.query(
      `
        INSERT INTO customers (
          user_id,
          first_name,
          last_name
        )
        VALUES ($1, $2, $3)
        RETURNING
          id,
          user_id,
          first_name,
          last_name
      `,
      [
        customer.userId,
        customer.firstName,
        customer.lastName
      ]
    );

    return CustomerMapper.toDomain(result.rows[0]);
  }

  async update(customer: Customer): Promise<void> {
    await postgresPool.query(
      `
        UPDATE customers
        SET
          first_name = $1,
          last_name = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `,
      [
        customer.firstName,
        customer.lastName,
        customer.id
      ]
    );
  }
}