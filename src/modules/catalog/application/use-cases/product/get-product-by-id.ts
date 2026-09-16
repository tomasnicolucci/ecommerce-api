import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { Product } from "../../../domain/entities/product.js";
import type { ProductRepository } from "../../../domain/repositories/product-repository.js";

export class GetProductById {
  constructor(
    private readonly productRepository: ProductRepository
  ) {}

  async execute(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  }
}