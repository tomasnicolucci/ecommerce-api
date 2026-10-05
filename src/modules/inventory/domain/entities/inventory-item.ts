import { ValidationError } from "../../../../shared/domain/errors/validation-error.js";

interface InventoryItemProps {
  variantId: string;
  quantity: number;
  reservedQuantity: number;
}

interface CreateInventoryItemProps {
  variantId: string;
  quantity: number;
  reservedQuantity?: number;
}

export class InventoryItem {
  private constructor(
    public readonly id: string | null,
    private props: InventoryItemProps
  ) { }

  static create(
    props: CreateInventoryItemProps
  ): InventoryItem {
    const reservedQuantity =
      props.reservedQuantity ?? 0;

    this.validateQuantity(
      props.quantity
    );

    this.validateReservedQuantity(
      reservedQuantity,
      props.quantity
    );

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
    this.validateQuantity(
      props.quantity
    );

    this.validateReservedQuantity(
      props.reservedQuantity,
      props.quantity
    );

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
    adjustment: number
  ): void {
    if (
      !Number.isInteger(adjustment) ||
      adjustment === 0
    ) {
      throw new ValidationError(
        "Stock adjustment must be a non-zero integer"
      );
    }

    const newQuantity =
      this.props.quantity +
      adjustment;

    if (newQuantity < 0) {
      throw new ValidationError(
        "Insufficient stock"
      );
    }

    if (
      newQuantity <
      this.props.reservedQuantity
    ) {
      throw new ValidationError(
        "Stock cannot be lower than reserved quantity"
      );
    }

    this.props.quantity =
      newQuantity;
  }

  private static validateQuantity(
    quantity: number
  ): void {
    if (
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      throw new ValidationError(
        "Inventory quantity must be a non-negative integer"
      );
    }
  }

  private static validateReservedQuantity(
    reservedQuantity: number,
    quantity: number
  ): void {
    if (
      !Number.isInteger(
        reservedQuantity
      ) ||
      reservedQuantity < 0
    ) {
      throw new ValidationError(
        "Reserved quantity must be a non-negative integer"
      );
    }

    if (
      reservedQuantity >
      quantity
    ) {
      throw new ValidationError(
        "Reserved quantity cannot exceed stock quantity"
      );
    }
  }
}