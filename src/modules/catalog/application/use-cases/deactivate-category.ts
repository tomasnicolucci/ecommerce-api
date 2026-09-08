import type { CategoryRepository } from "../../domain/repositories/category-repository.js";
import { AppError } from "../../../../shared/domain/errors/app-error.js";

export class DeactivateCategory {
  constructor(
    private readonly categoryRepository: CategoryRepository
  ) {}

  async execute(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    category.deactivate();

    await this.categoryRepository.update(category);
  }
}