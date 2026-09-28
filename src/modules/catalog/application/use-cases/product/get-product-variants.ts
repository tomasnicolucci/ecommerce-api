import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { ProductVariant } from "../../../domain/entities/product-variant.js";
import type { ProductRepository } from "../../../domain/repositories/product-repository.js";

export class GetProductVariants {
  constructor(
    private readonly productRepository: ProductRepository
  ) {}

  async execute(productId: string): Promise<ProductVariant[]> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product.variants;
  }
}