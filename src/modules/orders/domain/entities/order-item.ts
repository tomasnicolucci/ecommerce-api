interface OrderItemProps {
    productId: string;
    variantId: string;
    productName: string;
    sku: string;
    unitPrice: number;
    currency: string;
    quantity: number;
}

export class OrderItem {
    private constructor(
        public readonly id: string | null,
        private props: OrderItemProps
    ) { }

    static create(
        props: OrderItemProps
    ): OrderItem {
        if (props.quantity <= 0) {
            throw new Error(
                "Order item quantity must be greater than zero"
            );
        }

        if (props.unitPrice < 0) {
            throw new Error(
                "Order item price cannot be negative"
            );
        }

        return new OrderItem(null, props);
    }

    static restore(
        id: string,
        props: OrderItemProps
    ): OrderItem {
        return new OrderItem(id, props);
    }

    get productId(): string {
        return this.props.productId;
    }

    get variantId(): string {
        return this.props.variantId;
    }

    get productName(): string {
        return this.props.productName;
    }

    get sku(): string {
        return this.props.sku;
    }

    get unitPrice(): number {
        return this.props.unitPrice;
    }

    get currency(): string {
        return this.props.currency;
    }

    get quantity(): number {
        return this.props.quantity;
    }

    get subtotal(): number {
        return this.props.unitPrice * this.props.quantity;
    }
}