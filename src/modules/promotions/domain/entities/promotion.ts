
import { ValidationError } from "../../../../shared/domain/errors/validation-error.js";

export type DiscountType =
    | "PERCENTAGE"
    | "FIXED";

export interface PromotionProps {
    code: string;
    discountType: DiscountType;
    discountValue: number;
    minSubtotal: number;
    startsAt: Date;
    expiresAt: Date;
    maxUses: number | null;
    active: boolean;
}

export class Promotion {
    private constructor(
        public readonly id: string | null,
        private props: PromotionProps
    ) { }

    static create(
        props: PromotionProps
    ): Promotion {
        this.validate(props);

        return new Promotion(null, {
            ...props,
            code: props.code.trim().toUpperCase()
        });
    }

    static restore(
        id: string,
        props: PromotionProps
    ): Promotion {
        this.validate(props);

        return new Promotion(id, {
            ...props
        });
    }

    get data(): Readonly<PromotionProps> {
        return {
            ...this.props
        };
    }

    update(
        changes: Partial<PromotionProps>
    ): void {
        const next = {
            ...this.props,
            ...changes
        };

        Promotion.validate(next);

        this.props = {
            ...next,
            code: next.code.trim().toUpperCase()
        };
    }

    calculateDiscount(
        subtotal: number,
        at: Date = new Date()
    ): number {
        if (
            !this.props.active ||
            at < this.props.startsAt ||
            at >= this.props.expiresAt
        ) {
            throw new ValidationError(
                "Promotion is not active"
            );
        }

        if (
            !Number.isFinite(subtotal) ||
            subtotal < this.props.minSubtotal
        ) {
            throw new ValidationError(
                "Minimum subtotal not reached"
            );
        }

        const subtotalCents =
            Math.round(subtotal * 100);

        const discountCents =
            this.props.discountType === "PERCENTAGE"
                ? Math.round(
                    subtotalCents *
                    this.props.discountValue / 100
                )
                : Math.round(
                    this.props.discountValue * 100
                );

        return Math.min(
            subtotalCents,
            discountCents
        ) / 100;
    }

    private static validate(
        props: PromotionProps
    ): void {
        const code =
            props.code.trim().toUpperCase();

        if (
            !/^[A-Z0-9_-]{3,64}$/.test(code)
        ) {
            throw new ValidationError(
                "Invalid promotion code"
            );
        }

        if (
            props.discountType !== "PERCENTAGE" &&
            props.discountType !== "FIXED"
        ) {
            throw new ValidationError(
                "Invalid discount type"
            );
        }

        if (
            !Number.isFinite(props.discountValue) ||
            props.discountValue <= 0 ||
            (
                props.discountType === "PERCENTAGE" &&
                props.discountValue > 100
            )
        ) {
            throw new ValidationError(
                "Invalid discount value"
            );
        }

        if (
            !Number.isFinite(props.minSubtotal) ||
            props.minSubtotal < 0
        ) {
            throw new ValidationError(
                "Invalid minimum subtotal"
            );
        }

        if (
            !(props.startsAt instanceof Date) ||
            !(props.expiresAt instanceof Date) ||
            !Number.isFinite(props.startsAt.getTime()) ||
            !Number.isFinite(props.expiresAt.getTime()) ||
            props.expiresAt <= props.startsAt
        ) {
            throw new ValidationError(
                "Invalid promotion dates"
            );
        }

        if (
            props.maxUses !== null &&
            (
                !Number.isInteger(props.maxUses) ||
                props.maxUses <= 0
            )
        ) {
            throw new ValidationError(
                "Invalid maximum uses"
            );
        }
    }
}
