import type { CategoryRepository } from "../../../domain/repositories/category-repository.js";
import type { Category } from "../../../domain/entities/category.js";
import { CategoryModel } from "./category-schema.js";
import { CategoryMapper } from "./category-mapper.js";

export class MongoCategoryRepository implements CategoryRepository {
  async findById(id: string): Promise<Category | null> {
    const document = await CategoryModel.findById(id);

    return document
      ? CategoryMapper.toDomain(document)
      : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const document = await CategoryModel.findOne({ slug });

    return document
      ? CategoryMapper.toDomain(document)
      : null;
  }

  async findAll(): Promise<Category[]> {
    const documents = await CategoryModel.find();

    return documents.map((document) =>
      CategoryMapper.toDomain(document)
    );
  }

  async save(category: Category): Promise<Category> {
    const document = await CategoryModel.create(
      CategoryMapper.toPersistence(category)
    );

    return CategoryMapper.toDomain(document);
  }

  async update(category: Category): Promise<void> {
    if (!category.id) {
      throw new Error("Cannot update a category without an id");
    }

    await CategoryModel.findByIdAndUpdate(
      category.id,
      CategoryMapper.toPersistence(category)
    );
  }

  async delete(id: string): Promise<void> {
    await CategoryModel.findByIdAndDelete(id);
  }
}