import {
  beforeEach,
  describe,
  expect,
  it
} from "vitest";
import { AdjustStock } from "../../../modules/inventory/application/use-cases/inventory/adjust-stock.js";
import { InventoryItem } from "../../../modules/inventory/domain/entities/inventory-item.js";
import { InMemoryInventoryRepository } from "../../helpers/in-memory-inventory-repository.js";

describe("AdjustStock", () => {
  let repository:
    InMemoryInventoryRepository;
  let adjustStock: AdjustStock;

  beforeEach(() => {
    repository =
      new InMemoryInventoryRepository();

    adjustStock =
      new AdjustStock(repository);

    repository.inventoryItems.push(
      InventoryItem.restore(
        "inventory-1",
        {
          variantId: "variant-1",
          quantity: 10,
          reservedQuantity: 0
        }
      )
    );
  });

  it("should increase stock", async () => {
    const inventoryItem =
      await adjustStock.execute(
        "variant-1",
        5
      );

    expect(inventoryItem.quantity)
      .toBe(15);
  });

  it("should decrease stock", async () => {
    const inventoryItem =
      await adjustStock.execute(
        "variant-1",
        -4
      );

    expect(inventoryItem.quantity)
      .toBe(6);
  });

  it("should not decrease stock below zero", async () => {
    await expect(
      adjustStock.execute(
        "variant-1",
        -11
      )
    ).rejects.toThrow(
      "Insufficient stock"
    );
  });

  it("should not decrease stock below reserved quantity", async () => {
    repository.inventoryItems[0] =
      InventoryItem.restore(
        "inventory-1",
        {
          variantId: "variant-1",
          quantity: 10,
          reservedQuantity: 6
        }
      );

    await expect(
      adjustStock.execute(
        "variant-1",
        -5
      )
    ).rejects.toThrow(
      "Stock cannot be lower than reserved quantity"
    );
  });

  it("should throw when inventory does not exist", async () => {
    await expect(
      adjustStock.execute(
        "variant-2",
        5
      )
    ).rejects.toThrow(
      "Inventory not found"
    );
  });
});