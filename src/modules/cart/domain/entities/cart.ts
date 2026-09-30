import type { CartItem } from "./cart-item.js";

export type CartStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "ABANDONED";

interface CartProps {
  customerId: string;
  status: CartStatus;
  items: CartItem[];
}

export class Cart {
  private constructor(
    public readonly id: string | null,
    private props: CartProps
  ) {}

  static create(customerId: string): Cart {
    if (!customerId.trim()) {
      throw new Error("Customer id is required");
    }

    return new Cart(null, {
      customerId,
      status: "ACTIVE",
      items: []
    });
  }

  static restore(
    id: string,
    props: CartProps
  ): Cart {
    return new Cart(id, props);
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get status(): CartStatus {
    return this.props.status;
  }

  get items(): CartItem[] {
    return [...this.props.items];
  }

  get isActive(): boolean {
    return this.props.status === "ACTIVE";
  }
}