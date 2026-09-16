import type { Product } from "../../domain/entities/product.js";

export class ProductResponseMapper {
  static toResponse(product: Product) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      categoryId: product.categoryId,
      attributes: product.attributes,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        attributes: variant.attributes,
        price: {
          amount: variant.price.amount,
          currency: variant.price.currency
        },
        active: variant.active
      })),
      active: product.active
    };
  }
}