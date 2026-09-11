import { Money } from "../value-objects/money.js";
import type { ProductAttributes } from "../types/product-attributes.js";

interface ProductVariantProps {
  sku: string;
  attributes: ProductAttributes;
  price: Money;
  active: boolean;
}

export class ProductVariant {
  private constructor(
    public readonly id: string | null,
    private props: ProductVariantProps
  ) {}

  static create(props: ProductVariantProps): ProductVariant {
    if (!props.sku.trim()) {
      throw new Error("Product variant SKU is required");
    }

    return new ProductVariant(null, props);
  }

  static restore(
    id: string,
    props: ProductVariantProps
  ): ProductVariant {
    return new ProductVariant(id, props);
  }

  get sku(): string {
    return this.props.sku;
  }

  get attributes(): ProductAttributes {
    return { ...this.props.attributes };
  }

  get price(): Money {
    return this.props.price;
  }

  get active(): boolean {
    return this.props.active;
  }

  changePrice(price: Money): void {
    this.props.price = price;
  }

  changeAttributes(attributes: ProductAttributes): void {
    this.props.attributes = attributes;
  }

  activate(): void {
    this.props.active = true;
  }

  deactivate(): void {
    this.props.active = false;
  }
}