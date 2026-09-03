import type { Category } from "../entities/category.js";

export interface CategoryRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  save(category: Category): Promise<Category>;
  update(category: Category): Promise<void>;
  delete(id: string): Promise<void>;
}