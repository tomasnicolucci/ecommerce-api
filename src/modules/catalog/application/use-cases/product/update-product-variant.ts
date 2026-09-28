import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { ProductVariant } from "../../../domain/entities/product-variant.js";
import type { CategoryRepository } from "../../../domain/repositories/category-repository.js";
import type { ProductRepository } from "../../../domain/repositories/product-repository.js";
import { ProductAttributeValidator } from "../../../domain/services/product-attribute-validator.js";
import type { ProductAttributes } from "../../../domain/types/product-attributes.js";
import { Money } from "../../../domain/value-objects/money.js";

interface UpdateProductVariantInput {
  sku?: string;
  attributes?: ProductAttributes;
  price?: {
    amount: number;
    currency: string;
  };
}

export class UpdateProductVariant {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository
  ) {}

  async execute(
    productId: string,
    variantId: string,
    input: UpdateProductVariantInput
  ): Promise<ProductVariant> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const variant = product.variants.find(
      (variant) => variant.id === variantId
    );

    if (!variant) {
      throw new AppError("Product variant not found", 404);
    }

    if (input.sku !== undefined && input.sku !== variant.sku) {
      const existingSku =
        await this.productRepository.findBySku(input.sku);

      if (existingSku) {
        throw new AppError(
          `Product variant SKU "${input.sku}" already exists`,
          409
        );
      }
    }

    if (input.attributes !== undefined) {
      const category =
        await this.categoryRepository.findById(product.categoryId);

      if (!category) {
        throw new AppError("Category not found", 404);
      }

      if (!category.active) {
        throw new AppError("Category is inactive", 400);
      }

      const variantAttributeDefinitions = category.attributes.filter(
        (definition) => definition.scope === "variant"
      );

      ProductAttributeValidator.validate(
        input.attributes,
        variantAttributeDefinitions
      );
    }

    if (input.sku !== undefined) {
      variant.changeSku(input.sku);
    }

    if (input.attributes !== undefined) {
      variant.changeAttributes(input.attributes);
    }

    if (input.price !== undefined) {
      variant.changePrice(
        Money.create(
          input.price.amount,
          input.price.currency
        )
      );
    }

    await this.productRepository.update(product);

    return variant;
  }
}