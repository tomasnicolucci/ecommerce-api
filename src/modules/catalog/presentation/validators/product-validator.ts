import { z } from "zod";

const attributeValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean()
]);

const attributesSchema = z.record(
  z.string(),
  attributeValueSchema
);

const productVariantSchema = z.object({
  sku: z.string().trim().min(1),
  attributes: attributesSchema,
  price: z.object({
    amount: z.number().nonnegative(),
    currency: z.string().trim().length(3)
  })
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1),
    slug: z.string().trim().min(1),
    description: z.string(),
    categoryId: z.string().trim().min(1),
    attributes: attributesSchema,
    variants: z.array(productVariantSchema)
  })
});