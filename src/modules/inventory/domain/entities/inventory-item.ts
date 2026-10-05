interface InventoryItemProps {
  variantId: string;
  quantity: number;
  reservedQuantity: number;
}

export class InventoryItem {
  private constructor(
    public readonly id: string | null,
    private props: InventoryItemProps
  ) { }

  static create(
    props: Omit<
      InventoryItemProps,
      "reservedQuantity"
    > & {
      reservedQuantity?: number;
    }
  ): InventoryItem {
    const reservedQuantity =
      props.reservedQuantity ?? 0;

    if (!props.variantId.trim()) {
      throw new Error(
        "Variant id is required"
      );
    }

    if (
      !Number.isInteger(props.quantity) ||
      props.quantity < 0
    ) {
      throw new Error(
        "Inventory quantity must be a non-negative integer"
      );
    }

    if (
      !Number.isInteger(reservedQuantity) ||
      reservedQuantity < 0
    ) {
      throw new Error(
        "Reserved quantity must be a non-negative integer"
      );
    }

    if (
      reservedQuantity >
      props.quantity
    ) {
      throw new Error(
        "Reserved quantity cannot exceed stock quantity"
      );
    }

    return new InventoryItem(
      null,
      {
        variantId: props.variantId,
        quantity: props.quantity,
        reservedQuantity
      }
    );
  }

  static restore(
    id: string,
    props: InventoryItemProps
  ): InventoryItem {
    return new InventoryItem(
      id,
      props
    );
  }

  get variantId(): string {
    return this.props.variantId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get reservedQuantity(): number {
    return this.props.reservedQuantity;
  }

  get availableQuantity(): number {
    return (
      this.props.quantity -
      this.props.reservedQuantity
    );
  }

  adjustQuantity(
    quantity: number
  ): void {
    if (
      !Number.isInteger(quantity) ||
      quantity === 0
    ) {
      throw new Error(
        "Stock adjustment must be a non-zero integer"
      );
    }

    const newQuantity =
      this.props.quantity + quantity;

    if (newQuantity < 0) {
      throw new Error(
        "Insufficient stock"
      );
    }

    if (
      newQuantity <
      this.props.reservedQuantity
    ) {
      throw new Error(
        "Stock cannot be lower than reserved quantity"
      );
    }

    this.props.quantity =
      newQuantity;
  }
}