import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { ProductRepository } from "../../../domain/repositories/product-repository.js";

export class DeleteProductVariant {
  constructor(
    private readonly productRepository: ProductRepository
  ) {}

  async execute(
    productId: string,
    variantId: string
  ): Promise<void> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const variant = product.variants.find(
      (currentVariant) => currentVariant.id === variantId
    );

    if (!variant) {
      throw new AppError("Product variant not found", 404);
    }

    if (!product.hasVariants) {
      throw new AppError(
        "Default product variant cannot be deleted",
        400
      );
    }

    if (product.variants.length === 1) {
      throw new AppError(
        "Product must have at least one variant",
        400
      );
    }

    product.removeVariant(variantId);

    await this.productRepository.update(product);
  }
}