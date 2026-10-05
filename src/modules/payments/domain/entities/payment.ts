export type PaymentStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED";

interface PaymentProps {
    orderId: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
    createdAt: Date;
    resolvedAt: Date | null;
}

export class Payment {
    private constructor(
        public readonly id: string,
        private props: PaymentProps
    ) { }

    static restore(
        id: string,
        props: PaymentProps
    ): Payment {
        return new Payment(id, props);
    }

    get orderId(): string {
        return this.props.orderId;
    }

    get status(): PaymentStatus {
        return this.props.status;
    }

    get amount(): number {
        return this.props.amount;
    }

    get currency(): string {
        return this.props.currency;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get resolvedAt(): Date | null {
        return this.props.resolvedAt;
    }
}