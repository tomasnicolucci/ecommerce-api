import { describe, expect, it } from "vitest";
import {
    Promotion,
    type PromotionProps
} from "../../../modules/promotions/domain/entities/promotion.js";

describe("Promotion", () => {
    const validProps: PromotionProps = {
        code: "WELCOME10",
        discountType: "PERCENTAGE",
        discountValue: 10,
        minSubtotal: 50,
        startsAt: new Date("2026-01-01T00:00:00Z"),
        expiresAt: new Date("2027-01-01T00:00:00Z"),
        maxUses: 100,
        active: true
    };

    const validDate = new Date("2026-06-01T12:00:00Z");

    it("should create a promotion with a normalized code", () => {
        const promotion = Promotion.create({
            ...validProps,
            code: "welcome10"
        });

        expect(promotion.id).toBeNull();
        expect(promotion.data.code).toBe("WELCOME10");
    });

    it("should calculate a percentage discount on the subtotal", () => {
        const promotion = Promotion.create(validProps);

        expect(
            promotion.calculateDiscount(150, validDate)
        ).toBe(15);
    });

    it("should calculate a fixed discount on the subtotal", () => {
        const promotion = Promotion.create({
            ...validProps,
            discountType: "FIXED",
            discountValue: 25
        });

        expect(
            promotion.calculateDiscount(150, validDate)
        ).toBe(25);
    });

    it("should not allow a fixed discount to exceed the subtotal", () => {
        const promotion = Promotion.create({
            ...validProps,
            discountType: "FIXED",
            discountValue: 200,
            minSubtotal: 0
        });

        expect(
            promotion.calculateDiscount(150, validDate)
        ).toBe(150);
    });

    it("should round percentage discounts to two decimal places", () => {
        const promotion = Promotion.create({
            ...validProps,
            discountValue: 15,
            minSubtotal: 0
        });

        expect(
            promotion.calculateDiscount(19.99, validDate)
        ).toBe(3);
    });

    it("should reject percentage discounts above 100", () => {
        expect(() =>
            Promotion.create({
                ...validProps,
                discountValue: 110
            })
        ).toThrow("Invalid discount value");
    });

    it("should reject zero or negative discounts", () => {
        expect(() =>
            Promotion.create({
                ...validProps,
                discountValue: 0
            })
        ).toThrow("Invalid discount value");

        expect(() =>
            Promotion.create({
                ...validProps,
                discountValue: -10
            })
        ).toThrow("Invalid discount value");
    });

    it("should reject invalid promotion codes", () => {
        expect(() =>
            Promotion.create({
                ...validProps,
                code: "INVALID CODE!"
            })
        ).toThrow("Invalid promotion code");
    });

    it("should reject an expired promotion", () => {
        const promotion = Promotion.create(validProps);

        expect(() =>
            promotion.calculateDiscount(
                150,
                new Date("2027-02-01T00:00:00Z")
            )
        ).toThrow("Promotion is not active");
    });

    it("should reject a promotion that has not started", () => {
        const promotion = Promotion.create(validProps);

        expect(() =>
            promotion.calculateDiscount(
                150,
                new Date("2025-12-01T00:00:00Z")
            )
        ).toThrow("Promotion is not active");
    });

    it("should reject inactive promotions", () => {
        const promotion = Promotion.create({
            ...validProps,
            active: false
        });

        expect(() =>
            promotion.calculateDiscount(150, validDate)
        ).toThrow("Promotion is not active");
    });

    it("should reject a subtotal below the minimum", () => {
        const promotion = Promotion.create(validProps);

        expect(() =>
            promotion.calculateDiscount(40, validDate)
        ).toThrow("Minimum subtotal not reached");
    });

    it("should reject invalid date ranges", () => {
        expect(() =>
            Promotion.create({
                ...validProps,
                expiresAt: new Date("2025-01-01T00:00:00Z")
            })
        ).toThrow("Invalid promotion dates");
    });

    it("should reject invalid usage limits", () => {
        expect(() =>
            Promotion.create({
                ...validProps,
                maxUses: 0
            })
        ).toThrow("Invalid maximum uses");
    });

    it("should allow unlimited global uses", () => {
        const promotion = Promotion.create({
            ...validProps,
            maxUses: null
        });

        expect(promotion.data.maxUses).toBeNull();
    });

    it("should update promotion properties", () => {
        const promotion = Promotion.create(validProps);

        promotion.update({
            discountValue: 20,
            active: false
        });

        expect(promotion.data.discountValue).toBe(20);
        expect(promotion.data.active).toBe(false);
    });

    it("should reject invalid updates without changing the promotion", () => {
        const promotion = Promotion.create(validProps);

        expect(() =>
            promotion.update({
                discountValue: 150
            })
        ).toThrow("Invalid discount value");

        expect(promotion.data.discountValue).toBe(10);
    });
});