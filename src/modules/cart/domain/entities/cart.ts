import type { CartItem } from "./cart-item.js";

export type CartStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "ABANDONED";

interface CartProps {
  customerId: string;
  status: CartStatus;
  items: CartItem[];
  promotionCode?: string | null;
}

export class Cart {
  private constructor(
    public readonly id: string | null,
    private props: CartProps
  ) { }

  static create(customerId: string): Cart {
    if (!customerId.trim()) {
      throw new Error("Customer id is required");
    }

    return new Cart(null, {
      customerId,
      status: "ACTIVE",
      items: [],
      promotionCode: null
    });
  }

  static restore(
    id: string,
    props: CartProps
  ): Cart {
    return new Cart(id, {
      ...props,
      promotionCode: props.promotionCode ?? null
    });
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

  get promotionCode(): string | null {
    return this.props.promotionCode ?? null;
  }

  get isActive(): boolean {
    return this.props.status === "ACTIVE";
  }
}