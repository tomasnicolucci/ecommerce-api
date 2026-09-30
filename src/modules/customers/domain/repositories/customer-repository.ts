import type { Customer } from "../entities/customer.js";

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;

  findByUserId(
    userId: string
  ): Promise<Customer | null>;

  userExists(userId: string): Promise<boolean>;

  save(customer: Customer): Promise<Customer>;

  update(customer: Customer): Promise<void>;
}