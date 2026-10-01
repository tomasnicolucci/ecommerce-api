import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { Customer } from "../../../domain/entities/customer.js";
import type { CustomerRepository } from "../../../domain/repositories/customer-repository.js";

interface UpdateCustomerInput {
  firstName?: string | null;
  lastName?: string | null;
}

export class UpdateCustomer {
  constructor(
    private readonly customerRepository: CustomerRepository
  ) {}

  async execute(
    userId: string,
    input: UpdateCustomerInput
  ): Promise<Customer> {
    const customer =
      await this.customerRepository.findByUserId(
        userId
      );

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    customer.updateProfile(
      input.firstName !== undefined
        ? input.firstName
        : customer.firstName,
      input.lastName !== undefined
        ? input.lastName
        : customer.lastName
    );

    await this.customerRepository.update(customer);

    return customer;
  }
}