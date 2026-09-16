import type { Product } from "../../../domain/entities/product.js";
import type { ProductRepository } from "../../../domain/repositories/product-repository.js";

export class GetProducts {
  constructor(
    private readonly productRepository: ProductRepository
  ) {}

  async execute(): Promise<Product[]> {
    return this.productRepository.findAll();
  }
}