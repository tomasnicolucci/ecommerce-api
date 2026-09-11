import type { ProductAttributes } from "../types/product-attributes.js";
import { ProductVariant } from "./product-variant.js";

interface ProductProps {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  attributes: ProductAttributes;
  variants: ProductVariant[];
  active: boolean;
}

export class Product {
  private constructor(
    public readonly id: string | null,
    private props: ProductProps
  ) {}

  static create(props: ProductProps): Product {
    if (!props.name.trim()) {
      throw new Error("Product name is required");
    }

    if (!props.slug.trim()) {
      throw new Error("Product slug is required");
    }

    if (!props.categoryId.trim()) {
      throw new Error("Product category is required");
    }

    return new Product(null, props);
  }

  static restore(
    id: string,
    props: ProductProps
  ): Product {
    return new Product(id, props);
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get description(): string {
    return this.props.description;
  }

  get categoryId(): string {
    return this.props.categoryId;
  }

  get attributes(): ProductAttributes {
    return { ...this.props.attributes };
  }

  get variants(): ProductVariant[] {
    return [...this.props.variants];
  }

  get active(): boolean {
    return this.props.active;
  }

  rename(name: string): void {
    if (!name.trim()) {
      throw new Error("Product name is required");
    }

    this.props.name = name;
  }

  changeSlug(slug: string): void {
    if (!slug.trim()) {
      throw new Error("Product slug is required");
    }

    this.props.slug = slug;
  }

  changeDescription(description: string): void {
    this.props.description = description;
  }

  changeCategory(categoryId: string): void {
    if (!categoryId.trim()) {
      throw new Error("Product category is required");
    }

    this.props.categoryId = categoryId;
  }

  changeAttributes(attributes: ProductAttributes): void {
    this.props.attributes = attributes;
  }

  addVariant(variant: ProductVariant): void {
    const skuAlreadyExists = this.props.variants.some(
      (currentVariant) => currentVariant.sku === variant.sku
    );

    if (skuAlreadyExists) {
      throw new Error("Product variant SKU already exists");
    }

    this.props.variants.push(variant);
  }

  activate(): void {
    this.props.active = true;
  }

  deactivate(): void {
    this.props.active = false;
  }
}