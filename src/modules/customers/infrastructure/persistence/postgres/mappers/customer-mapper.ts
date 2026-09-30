import { Customer } from "../../../../domain/entities/customer.js";

interface CustomerRow {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
}

export class CustomerMapper {
  static toDomain(row: CustomerRow): Customer {
    return Customer.restore(row.id, {
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name
    });
  }
}