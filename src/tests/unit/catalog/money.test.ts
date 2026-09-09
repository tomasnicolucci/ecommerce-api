import { describe, expect, it } from "vitest";
import { Money } from "../../../modules/catalog/domain/value-objects/money.js";

describe("Money", () => {
  it("should create money", () => {
    const money = Money.create(1500, "USD");

    expect(money.amount).toBe(1500);
    expect(money.currency).toBe("USD");
  });

  it("should normalize currency", () => {
    const money = Money.create(1500, "usd");

    expect(money.currency).toBe("USD");
  });

  it("should not allow negative amounts", () => {
    expect(() =>
      Money.create(-100, "USD")
    ).toThrow("Money amount must be a non-negative number");
  });

  it("should not allow invalid currencies", () => {
    expect(() =>
      Money.create(100, "DOLLARS")
    ).toThrow("Currency must be a valid ISO 4217 code");
  });

  it("should compare money by value", () => {
    const first = Money.create(1500, "USD");
    const second = Money.create(1500, "USD");

    expect(first.equals(second)).toBe(true);
  });
});