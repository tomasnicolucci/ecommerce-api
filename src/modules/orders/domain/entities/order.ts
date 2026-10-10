import type { OrderItem } from "./order-item.js";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED";

export type OrderDiscountType =
  | "PERCENTAGE"
  | "FIXED";

interface OrderProps {
  customerId: string;
  cartId: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  createdAt: Date;
  subtotalAmount?: number;
  discountAmount?: number;
  promotionId?: string | null;
  couponCode?: string | null;
  discountType?: OrderDiscountType | null;
  discountValue?: number | null;
}

export class Order {
  private constructor(
    public readonly id: string | null,
    private props: OrderProps
  ) {}

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

    const currencies = new Set(
      items.map((item) => item.currency)
    );

    if (currencies.size !== 1) {
      throw new Error(
        "All order items must use the same currency"
      );
    }

    const subtotalCents = items.reduce(
      (total, item) =>
        total + Math.round(item.unitPrice * 100) * item.quantity,
      0
    );

    return new Order(null, {
      customerId,
      cartId,
      status: "PENDING",
      subtotalAmount: subtotalCents / 100,
      discountAmount: 0,
      totalAmount: subtotalCents / 100,
      currency: items[0].currency,
      items,
      createdAt: new Date(),
      promotionId: null,
      couponCode: null,
      discountType: null,
      discountValue: null
    });
  }

  static restore(id: string, props: OrderProps): Order {
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

  get subtotalAmount(): number {
    return this.props.subtotalAmount ?? this.props.totalAmount;
  }

  get discountAmount(): number {
    return this.props.discountAmount ?? 0;
  }

  get totalAmount(): number {
    return this.props.totalAmount;
  }

  get promotionId(): string | null {
    return this.props.promotionId ?? null;
  }

  get couponCode(): string | null {
    return this.props.couponCode ?? null;
  }

  get discountType(): OrderDiscountType | null {
    return this.props.discountType ?? null;
  }

  get discountValue(): number | null {
    return this.props.discountValue ?? null;
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