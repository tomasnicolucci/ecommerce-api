import type { CategoryRepository } from "../../domain/repositories/category-repository.js";
import { Category } from "../../domain/entities/category.js";
import type { AttributeDefinition } from "../../domain/types/attribute-definition.js";
import { AppError } from "../../../../shared/domain/errors/app-error.js";

interface CreateCategoryInput {
  name: string;
  slug: string;
  parentId: string | null;
  attributes: AttributeDefinition[];
}

export class CreateCategory {
  constructor(
    private readonly categoryRepository: CategoryRepository
  ) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    const existingCategory = await this.categoryRepository.findBySlug(
      input.slug
    );

    if (existingCategory) {
      throw new AppError("Category slug already exists", 409);
    }

    if (input.parentId) {
      const parentCategory = await this.categoryRepository.findById(
        input.parentId
      );

      if (!parentCategory) {
        throw new AppError("Parent category not found", 404);
      }
    }

    const category = Category.create({
      name: input.name,
      slug: input.slug,
      parentId: input.parentId,
      attributes: input.attributes,
      active: true
    });

    return this.categoryRepository.save(category);
  }
}