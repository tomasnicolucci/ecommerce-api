import { CreateCustomer } from "./application/use-cases/customer/create-customer.js";
import { GetCustomerById } from "./application/use-cases/customer/get-customer-by-id.js";
import { GetCustomerByUserId } from "./application/use-cases/customer/get-customer-by-user-id.js";
import { UpdateCustomer } from "./application/use-cases/customer/update-customer.js";
import { PostgresCustomerRepository } from "./infrastructure/persistence/postgres/repositories/postgres-customer-repository.js";
import { CustomerController } from "./presentation/controllers/customer-controller.js";

const customerRepository = new PostgresCustomerRepository();
const createCustomer = new CreateCustomer(customerRepository);
const getCustomerById = new GetCustomerById(customerRepository);
const getCustomerByUserId = new GetCustomerByUserId(customerRepository);
const updateCustomer = new UpdateCustomer(customerRepository);

export const customerController = new CustomerController(createCustomer, getCustomerById, getCustomerByUserId, updateCustomer);