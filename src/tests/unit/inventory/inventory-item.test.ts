import {
  describe,
  expect,
  it
} from "vitest";
import { InventoryItem } from "../../../modules/inventory/domain/entities/inventory-item.js";

describe("InventoryItem", () => {
  it("should create an inventory item", () => {
    const inventoryItem =
      InventoryItem.create({
        variantId: "variant-1",
        quantity: 10
      });

    expect(inventoryItem.id).toBeNull();
    expect(inventoryItem.variantId)
      .toBe("variant-1");
    expect(inventoryItem.quantity)
      .toBe(10);
    expect(
      inventoryItem.reservedQuantity
    ).toBe(0);
    expect(
      inventoryItem.availableQuantity
    ).toBe(10);
  });

  it("should create an inventory item with zero stock", () => {
    const inventoryItem =
      InventoryItem.create({
        variantId: "variant-1",
        quantity: 0
      });

    expect(inventoryItem.quantity)
      .toBe(0);
    expect(
      inventoryItem.reservedQuantity
    ).toBe(0);
    expect(
      inventoryItem.availableQuantity
    ).toBe(0);
  });

  it("should restore an inventory item with reserved stock", () => {
    const inventoryItem =
      InventoryItem.restore(
        "inventory-1",
        {
          variantId: "variant-1",
          quantity: 10,
          reservedQuantity: 3
        }
      );

    expect(inventoryItem.quantity)
      .toBe(10);
    expect(
      inventoryItem.reservedQuantity
    ).toBe(3);
    expect(
      inventoryItem.availableQuantity
    ).toBe(7);
  });

  it("should not create an inventory item with negative stock", () => {
    expect(() =>
      InventoryItem.create({
        variantId: "variant-1",
        quantity: -1
      })
    ).toThrow(
      "Inventory quantity must be a non-negative integer"
    );
  });

  it("should not create an inventory item with reserved quantity greater than stock", () => {
    expect(() =>
      InventoryItem.create({
        variantId: "variant-1",
        quantity: 5,
        reservedQuantity: 6
      })
    ).toThrow(
      "Reserved quantity cannot exceed stock quantity"
    );
  });

  it("should increase stock", () => {
    const inventoryItem =
      InventoryItem.create({
        variantId: "variant-1",
        quantity: 10
      });

    inventoryItem.adjustQuantity(5);

    expect(inventoryItem.quantity)
      .toBe(15);
    expect(
      inventoryItem.availableQuantity
    ).toBe(15);
  });

  it("should decrease stock", () => {
    const inventoryItem =
      InventoryItem.create({
        variantId: "variant-1",
        quantity: 10
      });

    inventoryItem.adjustQuantity(-4);

    expect(inventoryItem.quantity)
      .toBe(6);
  });

  it("should not decrease stock below zero", () => {
    const inventoryItem =
      InventoryItem.create({
        variantId: "variant-1",
        quantity: 3
      });

    expect(() =>
      inventoryItem.adjustQuantity(-4)
    ).toThrow("Insufficient stock");

    expect(inventoryItem.quantity)
      .toBe(3);
  });

  it("should not decrease stock below reserved quantity", () => {
    const inventoryItem =
      InventoryItem.restore(
        "inventory-1",
        {
          variantId: "variant-1",
          quantity: 10,
          reservedQuantity: 6
        }
      );

    expect(() =>
      inventoryItem.adjustQuantity(-5)
    ).toThrow(
      "Stock cannot be lower than reserved quantity"
    );

    expect(inventoryItem.quantity)
      .toBe(10);
    expect(
      inventoryItem.reservedQuantity
    ).toBe(6);
  });

  it("should not accept zero as stock adjustment", () => {
    const inventoryItem =
      InventoryItem.create({
        variantId: "variant-1",
        quantity: 10
      });

    expect(() =>
      inventoryItem.adjustQuantity(0)
    ).toThrow(
      "Stock adjustment must be a non-zero integer"
    );
  });
});