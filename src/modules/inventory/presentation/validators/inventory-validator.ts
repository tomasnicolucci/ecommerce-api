import { z } from "zod";

export const createInventoryItemSchema = z.object({
  body: z.object({
    variantId: z.string().trim().min(1),
    quantity: z.number().int().nonnegative()
  })
});

export const adjustStockSchema = z.object({
  body: z.object({
    quantity: z.number().int().refine(
      (value) => value !== 0,
      "Stock adjustment must be a non-zero integer"
    )
  })
});