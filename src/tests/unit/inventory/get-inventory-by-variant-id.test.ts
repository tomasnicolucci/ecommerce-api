import { beforeEach, describe, expect, it } from "vitest";
import { GetInventoryByVariantId } from "../../../modules/inventory/application/use-cases/inventory/get-inventory-by-variant-id.js";
import { InventoryItem } from "../../../modules/inventory/domain/entities/inventory-item.js";
import { InMemoryInventoryRepository } from "../../helpers/in-memory-inventory-repository.js";

describe("GetInventoryByVariantId", () => {
  let repository: InMemoryInventoryRepository;
  let getInventoryByVariantId: GetInventoryByVariantId;

  beforeEach(() => {
    repository = new InMemoryInventoryRepository();

    getInventoryByVariantId =
      new GetInventoryByVariantId(repository);
  });

  it("should get inventory by variant id", async () => {
    repository.inventoryItems.push(
      InventoryItem.restore("inventory-1", {
        variantId: "variant-1",
        quantity: 10
      })
    );

    const inventoryItem =
      await getInventoryByVariantId.execute("variant-1");

    expect(inventoryItem.id).toBe("inventory-1");
    expect(inventoryItem.variantId).toBe("variant-1");
    expect(inventoryItem.quantity).toBe(10);
  });

  it("should throw when inventory does not exist", async () => {
    await expect(
      getInventoryByVariantId.execute("variant-1")
    ).rejects.toThrow("Inventory not found");
  });
});