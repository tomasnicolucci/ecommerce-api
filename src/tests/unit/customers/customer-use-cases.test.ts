import { beforeEach, describe, expect, it } from "vitest";
import { CreateCustomer } from "../../../modules/customers/application/use-cases/customer/create-customer.js";
import { GetCustomerById } from "../../../modules/customers/application/use-cases/customer/get-customer-by-id.js";
import { GetCustomerByUserId } from "../../../modules/customers/application/use-cases/customer/get-customer-by-user-id.js";
import { UpdateCustomer } from "../../../modules/customers/application/use-cases/customer/update-customer.js";
import { InMemoryCustomerRepository } from "../../helpers/in-memory-customer-repository.js";

describe("Customer use cases", () => {
  let customerRepository: InMemoryCustomerRepository;

  beforeEach(() => {
    customerRepository =
      new InMemoryCustomerRepository();
  });

  it("should create a customer", async () => {
    const useCase =
      new CreateCustomer(customerRepository);

    const customer = await useCase.execute({
      userId: "user-1",
      firstName: "John",
      lastName: "Doe"
    });

    expect(customer.id).toBeDefined();
    expect(customer.userId).toBe("user-1");
    expect(customer.firstName).toBe("John");
    expect(customer.lastName).toBe("Doe");
  });

  it("should not create more than one customer for the same user", async () => {
    const useCase =
      new CreateCustomer(customerRepository);

    await useCase.execute({
      userId: "user-1",
      firstName: "John",
      lastName: "Doe"
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        firstName: "Jane",
        lastName: "Doe"
      })
    ).rejects.toThrow(
      "Customer already exists for this user"
    );
  });

  it("should get a customer by id", async () => {
    const createCustomer =
      new CreateCustomer(customerRepository);

    const created = await createCustomer.execute({
      userId: "user-1",
      firstName: "John",
      lastName: "Doe"
    });

    const getCustomer =
      new GetCustomerById(customerRepository);

    const customer =
      await getCustomer.execute(created.id!);

    expect(customer.id).toBe(created.id);
  });

  it("should throw when customer id does not exist", async () => {
    const useCase =
      new GetCustomerById(customerRepository);

    await expect(
      useCase.execute("missing-customer")
    ).rejects.toThrow("Customer not found");
  });

  it("should get a customer by user id", async () => {
    const createCustomer =
      new CreateCustomer(customerRepository);

    await createCustomer.execute({
      userId: "user-1",
      firstName: "John",
      lastName: "Doe"
    });

    const getCustomer =
      new GetCustomerByUserId(customerRepository);

    const customer =
      await getCustomer.execute("user-1");

    expect(customer.userId).toBe("user-1");
  });

  it("should throw when customer for user does not exist", async () => {
    const useCase =
      new GetCustomerByUserId(customerRepository);

    await expect(
      useCase.execute("missing-user")
    ).rejects.toThrow("Customer not found");
  });

  it("should update a customer by user id", async () => {
    const createCustomer =
      new CreateCustomer(customerRepository);

    await createCustomer.execute({
      userId: "user-1",
      firstName: "John",
      lastName: "Doe"
    });

    const updateCustomer =
      new UpdateCustomer(customerRepository);

    const updated =
      await updateCustomer.execute(
        "user-1",
        {
          firstName: "Jane",
          lastName: "Smith"
        }
      );

    expect(updated.firstName).toBe("Jane");
    expect(updated.lastName).toBe("Smith");
  });

  it("should update only the provided fields", async () => {
    const createCustomer =
      new CreateCustomer(customerRepository);

    await createCustomer.execute({
      userId: "user-1",
      firstName: "John",
      lastName: "Doe"
    });

    const updateCustomer =
      new UpdateCustomer(customerRepository);

    const updated =
      await updateCustomer.execute(
        "user-1",
        {
          firstName: "Jane"
        }
      );

    expect(updated.firstName).toBe("Jane");
    expect(updated.lastName).toBe("Doe");
  });

  it("should throw when updating a non-existing customer", async () => {
    const useCase =
      new UpdateCustomer(customerRepository);

    await expect(
      useCase.execute(
        "missing-user",
        {
          firstName: "Jane"
        }
      )
    ).rejects.toThrow("Customer not found");
  });
});