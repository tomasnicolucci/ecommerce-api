import type { HydratedDocument } from "mongoose";
import { Category } from "../../../domain/entities/category.js";
import type { CategoryDocument } from "./category-schema.js";

export class CategoryMapper {
  static toDomain(
    document: HydratedDocument<CategoryDocument>
  ): Category {
    return Category.restore(document._id.toString(), {
      name: document.name,
      slug: document.slug,
      parentId: document.parentId
        ? document.parentId.toString()
        : null,
      attributes: document.attributes,
      active: document.active
    });
  }

  static toPersistence(category: Category) {
    return {
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      attributes: category.attributes,
      active: category.active
    };
  }
}