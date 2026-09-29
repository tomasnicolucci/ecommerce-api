import type { Request, Response } from "express";
import type { CreateInventoryItem } from "../../application/use-cases/inventory/create-inventory-item.js";
import type { GetInventoryByVariantId } from "../../application/use-cases/inventory/get-inventory-by-variant-id.js";
import type { AdjustStock } from "../../application/use-cases/inventory/adjust-stock.js";
import { InventoryResponseMapper } from "../mappers/inventory-response-mapper.js";

export class InventoryController {
  constructor(
    private readonly createInventoryItem: CreateInventoryItem,
    private readonly getInventoryByVariantId: GetInventoryByVariantId,
    private readonly adjustStock: AdjustStock
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const inventoryItem =
      await this.createInventoryItem.execute(req.body);

    res
      .status(201)
      .json(InventoryResponseMapper.toResponse(inventoryItem));
  };

  getByVariantId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const variantId = req.params.variantId;

    if (typeof variantId !== "string") {
      throw new Error("Invalid variant id");
    }

    const inventoryItem =
      await this.getInventoryByVariantId.execute(variantId);

    res.json(
      InventoryResponseMapper.toResponse(inventoryItem)
    );
  };

  adjustStockQuantity = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const variantId = req.params.variantId;

    if (typeof variantId !== "string") {
      throw new Error("Invalid variant id");
    }

    const inventoryItem = await this.adjustStock.execute(
      variantId,
      req.body.quantity
    );

    res.json(
      InventoryResponseMapper.toResponse(inventoryItem)
    );
  };
}