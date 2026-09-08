import { Category } from "../../modules/catalog/domain/entities/category.js";
import type { CategoryRepository } from "../../modules/catalog/domain/repositories/category-repository.js";

export class InMemoryCategoryRepository implements CategoryRepository {
  public categories: Category[] = [];

  async findById(id: string): Promise<Category | null> {
    return this.categories.find((category) => category.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.categories.find((category) => category.slug === slug) ?? null;
  }

  async findAll(): Promise<Category[]> {
    return this.categories;
  }

  async save(category: Category): Promise<Category> {
    const savedCategory = Category.restore(
      category.id ?? `category-${this.categories.length + 1}`,
      {
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        attributes: category.attributes,
        active: category.active
      }
    );

    this.categories.push(savedCategory);

    return savedCategory;
  }

  async update(category: Category): Promise<void> {
    const index = this.categories.findIndex(
      (currentCategory) => currentCategory.id === category.id
    );

    if (index !== -1) {
      this.categories[index] = category;
    }
  }

  async delete(id: string): Promise<void> {
    this.categories = this.categories.filter(
      (category) => category.id !== id
    );
  }
}