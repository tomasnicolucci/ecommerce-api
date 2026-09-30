import type { Customer } from "../../domain/entities/customer.js";

export class CustomerResponseMapper {
  static toResponse(customer: Customer) {
    return {
      id: customer.id,
      userId: customer.userId,
      firstName: customer.firstName,
      lastName: customer.lastName
    };
  }
}