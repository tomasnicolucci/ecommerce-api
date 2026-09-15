import { Product } from "../../../../domain/entities/product.js";
import { ProductVariant } from "../../../../domain/entities/product-variant.js";
import { Money } from "../../../../domain/value-objects/money.js";

export class ProductMapper {
  static toDomain(document: any): Product {
    const variants = document.variants.map((variant: any) =>
      ProductVariant.restore(
        variant._id.toString(),
        {
          sku: variant.sku,
          attributes: variant.attributes,
          price: Money.create(
            variant.price.amount,
            variant.price.currency
          ),
          active: variant.active
        }
      )
    );

    return Product.restore(
      document._id.toString(),
      {
        name: document.name,
        slug: document.slug,
        description: document.description,
        categoryId: document.categoryId.toString(),
        attributes: document.attributes,
        variants,
        active: document.active
      }
    );
  }

  static toPersistence(product: Product) {
    return {
      name: product.name,
      slug: product.slug,
      description: product.description,
      categoryId: product.categoryId,
      attributes: product.attributes,
      variants: product.variants.map((variant) => ({
        ...(variant.id && { _id: variant.id }),
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