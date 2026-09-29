interface InventoryItemProps {
  variantId: string;
  quantity: number;
}

export class InventoryItem {
  private constructor(
    public readonly id: string | null,
    private props: InventoryItemProps
  ) {}

  static create(props: InventoryItemProps): InventoryItem {
    if (!props.variantId.trim()) {
      throw new Error("Variant id is required");
    }

    if (!Number.isInteger(props.quantity) || props.quantity < 0) {
      throw new Error(
        "Inventory quantity must be a non-negative integer"
      );
    }

    return new InventoryItem(null, props);
  }

  static restore(
    id: string,
    props: InventoryItemProps
  ): InventoryItem {
    return new InventoryItem(id, props);
  }

  get variantId(): string {
    return this.props.variantId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  adjustQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity === 0) {
      throw new Error(
        "Stock adjustment must be a non-zero integer"
      );
    }

    const newQuantity = this.props.quantity + quantity;

    if (newQuantity < 0) {
      throw new Error("Insufficient stock");
    }

    this.props.quantity = newQuantity;
  }
}