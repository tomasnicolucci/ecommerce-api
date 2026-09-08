import type { AttributeDefinition } from "../../domain/types/attribute-definition.js";
import type { CategoryRepository } from "../../domain/repositories/category-repository.js";
import type { Category } from "../../domain/entities/category.js";
import { AppError } from "../../../../shared/domain/errors/app-error.js";

interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  parentId?: string | null;
  attributes?: AttributeDefinition[];
}

export class UpdateCategory {
  constructor(
    private readonly categoryRepository: CategoryRepository
  ) {}

  async execute(
    id: string,
    input: UpdateCategoryInput
  ): Promise<Category> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    if (input.slug !== undefined && input.slug !== category.slug) {
      const existingCategory =
        await this.categoryRepository.findBySlug(input.slug);

      if (existingCategory) {
        throw new AppError("Category slug already exists", 409);
      }

      category.changeSlug(input.slug);
    }

    if (input.parentId !== undefined) {
      if (input.parentId !== null) {
        if (input.parentId === id) {
          throw new AppError(
            "Category cannot be its own parent",
            400
          );
        }

        const parentCategory =
          await this.categoryRepository.findById(input.parentId);

        if (!parentCategory) {
          throw new AppError("Parent category not found", 404);
        }
      }

      category.changeParent(input.parentId);
    }

    if (input.name !== undefined) {
      category.rename(input.name);
    }

    if (input.attributes !== undefined) {
      category.changeAttributes(input.attributes);
    }

    await this.categoryRepository.update(category);

    return category;
  }
}