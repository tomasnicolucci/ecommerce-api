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

const baseProductSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string(),
  categoryId: z.string().trim().min(1),
  attributes: attributesSchema
});

export const createProductSchema = z.object({
  body: z.discriminatedUnion("hasVariants", [
    baseProductSchema.extend({
      hasVariants: z.literal(true),
      variants: z.array(productVariantSchema).min(1)
    }),
    baseProductSchema.extend({
      hasVariants: z.literal(false),
      sku: z.string().trim().min(1),
      price: z.object({
        amount: z.number().nonnegative(),
        currency: z.string().trim().length(3)
      })
    })
  ])
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).optional(),
    slug: z.string().trim().min(1).optional(),
    description: z.string().optional(),
    categoryId: z.string().trim().min(1).optional(),
    attributes: attributesSchema.optional()
  })
});

export const createProductVariantSchema = z.object({
  body: z.object({
    sku: z.string().trim().min(1),
    attributes: attributesSchema,
    price: z.object({
      amount: z.number().nonnegative(),
      currency: z.string().trim().min(1)
    })
  })
});

export const updateProductVariantSchema = z.object({
  body: z.object({
    sku: z.string().trim().min(1).optional(),
    attributes: attributesSchema.optional(),
    price: z.object({
      amount: z.number().nonnegative(),
      currency: z.string().trim().length(3)
    }).optional()
  })
});