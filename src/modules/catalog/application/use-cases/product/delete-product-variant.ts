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
      (variant) => variant.id === variantId
    );

    if (!variant) {
      throw new AppError("Product variant not found", 404);
    }

    product.removeVariant(variantId);

    await this.productRepository.update(product);
  }
}