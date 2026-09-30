import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import { Customer } from "../../../domain/entities/customer.js";
import type { CustomerRepository } from "../../../domain/repositories/customer-repository.js";

interface CreateCustomerInput {
  userId: string;
  firstName: string | null;
  lastName: string | null;
}

export class CreateCustomer {
  constructor(
    private readonly customerRepository: CustomerRepository
  ) {}

  async execute(
    input: CreateCustomerInput
  ): Promise<Customer> {
    const userExists =
      await this.customerRepository.userExists(
        input.userId
      );

    if (!userExists) {
      throw new AppError("User not found", 404);
    }

    const existingCustomer =
      await this.customerRepository.findByUserId(
        input.userId
      );

    if (existingCustomer) {
      throw new AppError(
        "Customer already exists for this user",
        409
      );
    }

    const customer = Customer.create({
      userId: input.userId,
      firstName: input.firstName,
      lastName: input.lastName
    });

    return this.customerRepository.save(customer);
  }
}