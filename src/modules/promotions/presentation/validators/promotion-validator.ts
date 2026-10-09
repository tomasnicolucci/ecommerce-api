import { z } from "zod";

const fields = {
    code: z.string()
        .trim()
        .min(3)
        .max(64)
        .regex(/^[a-zA-Z0-9_-]+$/),

    discountType: z.enum([
        "PERCENTAGE",
        "FIXED"
    ]),

    discountValue: z.number().positive(),

    minSubtotal: z.number().nonnegative(),

    startsAt: z.coerce.date(),

    expiresAt: z.coerce.date(),

    maxUses: z.number().int().positive().nullable(),

    active: z.boolean()
};

export const createPromotionSchema = z.object({
    body: z.object(fields).extend({
        minSubtotal: fields.minSubtotal.default(0),
        maxUses: fields.maxUses.default(null),
        active: fields.active.default(true)
    })
});

export const updatePromotionSchema = z.object({
    body: z.object(fields)
        .partial()
        .refine(
            (value) => Object.keys(value).length > 0,
            "At least one field is required"
        )
});