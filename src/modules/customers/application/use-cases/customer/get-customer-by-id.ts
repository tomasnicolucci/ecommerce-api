import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { Customer } from "../../../domain/entities/customer.js";
import type { CustomerRepository } from "../../../domain/repositories/customer-repository.js";

export class GetCustomerById {
  constructor(
    private readonly customerRepository: CustomerRepository
  ) {}

  async execute(id: string): Promise<Customer> {
    const customer =
      await this.customerRepository.findById(id);

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    return customer;
  }
}