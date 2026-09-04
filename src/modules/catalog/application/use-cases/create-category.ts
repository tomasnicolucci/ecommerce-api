import type { CategoryRepository } from "../../domain/repositories/category-repository.js";
import { Category } from "../../domain/entities/category.js";
import type { AttributeDefinition } from "../../domain/types/attribute-definition.js";

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
      throw new Error("Category slug already exists");
    }

    if (input.parentId) {
      const parentCategory = await this.categoryRepository.findById(
        input.parentId
      );

      if (!parentCategory) {
        throw new Error("Parent category not found");
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