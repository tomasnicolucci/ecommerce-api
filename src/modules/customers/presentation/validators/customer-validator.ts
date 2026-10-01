import { z } from "zod";

export const createCustomerSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .trim()
      .min(1)
      .nullable(),
    lastName: z
      .string()
      .trim()
      .min(1)
      .nullable()
  })
});

export const updateCustomerSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .trim()
      .min(1)
      .nullable()
      .optional(),
    lastName: z
      .string()
      .trim()
      .min(1)
      .nullable()
      .optional()
  })
});