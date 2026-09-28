import type { ProductVariant } from "../../domain/entities/product-variant.js";

export class ProductVariantResponseMapper {
  static toResponse(variant: ProductVariant) {
    return {
      id: variant.id,
      sku: variant.sku,
      attributes: variant.attributes,
      price: {
        amount: variant.price.amount,
        currency: variant.price.currency
      },
      active: variant.active
    };
  }
}