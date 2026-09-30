interface CartItemProps {
  cartId: string;
  variantId: string;
  quantity: number;
}

export class CartItem {
  private constructor(
    public readonly id: string | null,
    private props: CartItemProps
  ) {}

  static create(props: CartItemProps): CartItem {
    if (!props.variantId.trim()) {
      throw new Error("Product variant id is required");
    }

    if (!Number.isInteger(props.quantity) || props.quantity <= 0) {
      throw new Error("Cart item quantity must be a positive integer");
    }

    return new CartItem(null, props);
  }

  static restore(
    id: string,
    props: CartItemProps
  ): CartItem {
    return new CartItem(id, props);
  }

  get cartId(): string {
    return this.props.cartId;
  }

  get variantId(): string {
    return this.props.variantId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  changeQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Cart item quantity must be a positive integer");
    }

    this.props.quantity = quantity;
  }
}