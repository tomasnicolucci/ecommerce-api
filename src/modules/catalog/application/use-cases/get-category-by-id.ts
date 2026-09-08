import type { CategoryRepository } from "../../domain/repositories/category-repository.js";
import type { Category } from "../../domain/entities/category.js";
import { AppError } from "../../../../shared/domain/errors/app-error.js";

export class GetCategoryById {
  constructor(
    private readonly categoryRepository: CategoryRepository
  ) {}

  async execute(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    return category;
  }
}