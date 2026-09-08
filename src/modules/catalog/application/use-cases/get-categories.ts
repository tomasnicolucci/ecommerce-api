import type { CategoryRepository } from "../../domain/repositories/category-repository.js";
import type { Category } from "../../domain/entities/category.js";

export class GetCategories {
  constructor(
    private readonly categoryRepository: CategoryRepository
  ) {}

  async execute(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }
}