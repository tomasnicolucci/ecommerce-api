import { z } from "zod";

const attributeDefinitionSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(["string", "number", "boolean", "select"]),
  scope: z.enum(["product", "variant"]),
  required: z.boolean(),
  options: z.array(z.string()).optional()
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).optional(),
    slug: z.string().trim().min(1).optional(),
    parentId: z.string().nullable().optional(),
    attributes: z.array(attributeDefinitionSchema).optional()
  })
});