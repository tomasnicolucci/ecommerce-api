import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { ProductVariant } from "../../../domain/entities/product-variant.js";
import type { ProductRepository } from "../../../domain/repositories/product-repository.js";

export class GetProductVariantById {
  constructor(
    private readonly productRepository: ProductRepository
  ) {}

  async execute(
    productId: string,
    variantId: string
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

    return variant;
  }
}