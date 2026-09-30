import { z } from "zod";

export const addCartItemSchema = z.object({
  body: z.object({
    variantId: z.string().trim().min(1),
    quantity: z.number().int().positive()
  })
});

export const updateCartItemQuantitySchema = z.object({
  body: z.object({
    quantity: z.number().int().positive()
  })
});