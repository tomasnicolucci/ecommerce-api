import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { Product } from "../../../domain/entities/product.js";
import type { CategoryRepository } from "../../../domain/repositories/category-repository.js";
import type { ProductRepository } from "../../../domain/repositories/product-repository.js";
import { ProductAttributeValidator } from "../../../domain/services/product-attribute-validator.js";
import type { ProductAttributes } from "../../../domain/types/product-attributes.js";

interface UpdateProductInput {
  name?: string;
  slug?: string;
  description?: string;
  categoryId?: string;
  attributes?: ProductAttributes;
}

export class UpdateProduct {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository
  ) {}

  async execute(
    id: string,
    input: UpdateProductInput
  ): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (input.slug && input.slug !== product.slug) {
      const existingProduct =
        await this.productRepository.findBySlug(input.slug);

      if (existingProduct) {
        throw new AppError("Product slug already exists", 409);
      }
    }

    const categoryId = input.categoryId ?? product.categoryId;

    const category =
      await this.categoryRepository.findById(categoryId);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    if (!category.active) {
      throw new AppError("Category is inactive", 400);
    }

    const attributes = input.attributes ?? product.attributes;

    const productAttributeDefinitions = category.attributes.filter(
      (definition) => definition.scope === "product"
    );

    ProductAttributeValidator.validate(
      attributes,
      productAttributeDefinitions
    );

    if (input.name !== undefined) {
      product.rename(input.name);
    }

    if (input.slug !== undefined) {
      product.changeSlug(input.slug);
    }

    if (input.description !== undefined) {
      product.changeDescription(input.description);
    }

    if (input.categoryId !== undefined) {
      product.changeCategory(input.categoryId);
    }

    if (input.attributes !== undefined) {
      product.changeAttributes(input.attributes);
    }

    await this.productRepository.update(product);

    return product;
  }
}