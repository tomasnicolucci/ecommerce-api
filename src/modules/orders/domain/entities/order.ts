import type { OrderItem } from "./order-item.js";

export type OrderStatus =
    | "PENDING"
    | "CONFIRMED"
    | "CANCELLED";

interface OrderProps {
    customerId: string;
    cartId: string;
    status: OrderStatus;
    totalAmount: number;
    currency: string;
    items: OrderItem[];
    createdAt: Date;
}

export class Order {
    private constructor(
        public readonly id: string | null,
        private props: OrderProps
    ) { }

    static create(
        customerId: string,
        cartId: string,
        items: OrderItem[]
    ): Order {
        if (items.length === 0) {
            throw new Error(
                "Order must contain at least one item"
            );
        }

        const currencies =
            new Set(
                items.map((item) => item.currency)
            );

        if (currencies.size !== 1) {
            throw new Error(
                "All order items must use the same currency"
            );
        }

        const totalAmount =
            items.reduce(
                (total, item) =>
                    total + item.subtotal,
                0
            );

        return new Order(null, {
            customerId,
            cartId,
            status: "PENDING",
            totalAmount,
            currency: items[0].currency,
            items,
            createdAt: new Date()
        });
    }

    static restore(
        id: string,
        props: OrderProps
    ): Order {
        return new Order(id, props);
    }

    get customerId(): string {
        return this.props.customerId;
    }

    get cartId(): string {
        return this.props.cartId;
    }

    get status(): OrderStatus {
        return this.props.status;
    }

    get totalAmount(): number {
        return this.props.totalAmount;
    }

    get currency(): string {
        return this.props.currency;
    }

    get items(): OrderItem[] {
        return [...this.props.items];
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }
}