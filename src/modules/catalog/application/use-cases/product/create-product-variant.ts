import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import { ProductVariant } from "../../../domain/entities/product-variant.js";
import type { CategoryRepository } from "../../../domain/repositories/category-repository.js";
import type { ProductRepository } from "../../../domain/repositories/product-repository.js";
import { ProductAttributeValidator } from "../../../domain/services/product-attribute-validator.js";
import type { ProductAttributes } from "../../../domain/types/product-attributes.js";
import { Money } from "../../../domain/value-objects/money.js";

interface CreateProductVariantInput {
  sku: string;
  attributes: ProductAttributes;
  price: {
    amount: number;
    currency: string;
  };
}

export class CreateProductVariant {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository
  ) {}

  async execute(
    productId: string,
    input: CreateProductVariantInput
  ): Promise<ProductVariant> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (!product.hasVariants) {
      throw new AppError(
        "Product does not support multiple variants",
        400
      );
    }

    const existingSku =
      await this.productRepository.findBySku(input.sku);

    if (existingSku) {
      throw new AppError(
        `Product variant SKU "${input.sku}" already exists`,
        409
      );
    }

    const category =
      await this.categoryRepository.findById(product.categoryId);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    if (!category.active) {
      throw new AppError("Category is inactive", 400);
    }

    const variantAttributeDefinitions = category.attributes.filter(
      (definition) => definition.scope === "variant"
    );

    ProductAttributeValidator.validate(
      input.attributes,
      variantAttributeDefinitions
    );

    const variant = ProductVariant.create({
      sku: input.sku,
      attributes: input.attributes,
      price: Money.create(
        input.price.amount,
        input.price.currency
      ),
      active: true
    });

    product.addVariant(variant);

    await this.productRepository.update(product);

    const updatedProduct =
      await this.productRepository.findById(productId);

    if (!updatedProduct) {
      throw new AppError(
        "Product not found after update",
        500
      );
    }

    const createdVariant = updatedProduct.variants.find(
      (currentVariant) => currentVariant.sku === input.sku
    );

    if (!createdVariant) {
      throw new AppError(
        "Product variant not found after creation",
        500
      );
    }

    return createdVariant;
  }
}