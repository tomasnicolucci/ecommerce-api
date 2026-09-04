import { z } from "zod";

const attributeDefinitionSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(["string", "number", "boolean", "select"]),
  required: z.boolean(),
  options: z.array(z.string()).optional()
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1),
    slug: z.string().trim().min(1),
    parentId: z.string().nullable(),
    attributes: z.array(attributeDefinitionSchema).default([])
  })
});