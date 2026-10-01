import { Customer } from "../../modules/customers/domain/entities/customer.js";
import type { CustomerRepository } from "../../modules/customers/domain/repositories/customer-repository.js";

export class InMemoryCustomerRepository
  implements CustomerRepository
{
  public customers: Customer[] = [];

  async findById(
    id: string
  ): Promise<Customer | null> {
    return (
      this.customers.find(
        (customer) => customer.id === id
      ) ?? null
    );
  }

  async findByUserId(
    userId: string
  ): Promise<Customer | null> {
    return (
      this.customers.find(
        (customer) => customer.userId === userId
      ) ?? null
    );
  }

  async save(
    customer: Customer
  ): Promise<Customer> {
    const savedCustomer = Customer.restore(
      customer.id ??
        `customer-${this.customers.length + 1}`,
      {
        userId: customer.userId,
        firstName: customer.firstName,
        lastName: customer.lastName
      }
    );

    this.customers.push(savedCustomer);

    return savedCustomer;
  }

  async update(customer: Customer): Promise<void> {
    const index = this.customers.findIndex(
      (item) => item.id === customer.id
    );

    if (index !== -1) {
      this.customers[index] = customer;
    }
  }
}