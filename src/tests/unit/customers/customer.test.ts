import { describe, expect, it } from "vitest";
import { Customer } from "../../../modules/customers/domain/entities/customer.js";

describe("Customer", () => {
  it("should create a customer", () => {
    const customer = Customer.create({
      userId: "user-1",
      firstName: "John",
      lastName: "Doe"
    });

    expect(customer.id).toBeNull();
    expect(customer.userId).toBe("user-1");
    expect(customer.firstName).toBe("John");
    expect(customer.lastName).toBe("Doe");
  });

  it("should allow nullable profile fields", () => {
    const customer = Customer.create({
      userId: "user-1",
      firstName: null,
      lastName: null
    });

    expect(customer.firstName).toBeNull();
    expect(customer.lastName).toBeNull();
  });

  it("should reject an empty user id", () => {
    expect(() =>
      Customer.create({
        userId: "",
        firstName: "John",
        lastName: "Doe"
      })
    ).toThrow("User id is required");
  });

  it("should update the customer profile", () => {
    const customer = Customer.create({
      userId: "user-1",
      firstName: "John",
      lastName: "Doe"
    });

    customer.updateProfile(
      "Jane",
      "Smith"
    );

    expect(customer.firstName).toBe("Jane");
    expect(customer.lastName).toBe("Smith");
  });
});