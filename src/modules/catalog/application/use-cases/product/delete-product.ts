import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { ProductRepository } from "../../../domain/repositories/product-repository.js";

export class DeleteProduct {
  constructor(
    private readonly productRepository: ProductRepository
  ) {}

  async execute(id: string): Promise<void> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    await this.productRepository.delete(id);
  }
}