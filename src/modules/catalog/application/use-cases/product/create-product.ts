import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import { Product } from "../../../domain/entities/product.js";
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

interface CreateProductWithVariantsInput {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  attributes: ProductAttributes;
  hasVariants: true;
  variants: CreateProductVariantInput[];
}

interface CreateProductWithoutVariantsInput {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  attributes: ProductAttributes;
  hasVariants: false;
  sku: string;
  price: {
    amount: number;
    currency: string;
  };
}

type CreateProductInput =
  | CreateProductWithVariantsInput
  | CreateProductWithoutVariantsInput;

export class CreateProduct {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository
  ) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const existingProduct =
      await this.productRepository.findBySlug(input.slug);

    if (existingProduct) {
      throw new AppError("Product slug already exists", 409);
    }

    const category =
      await this.categoryRepository.findById(input.categoryId);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    if (!category.active) {
      throw new AppError("Category is inactive", 400);
    }

    const productAttributeDefinitions = category.attributes.filter(
      (definition) => definition.scope === "product"
    );

    ProductAttributeValidator.validate(
      input.attributes,
      productAttributeDefinitions
    );

    const variantAttributeDefinitions = category.attributes.filter(
      (definition) => definition.scope === "variant"
    );

    const variants: ProductVariant[] = [];

    if (input.hasVariants) {
      if (input.variants.length === 0) {
        throw new AppError(
          "Product with variants must have at least one variant",
          400
        );
      }

      const inputSkus = new Set<string>();

      for (const variantInput of input.variants) {
        if (inputSkus.has(variantInput.sku)) {
          throw new AppError(
            `Product variant SKU "${variantInput.sku}" is duplicated`,
            409
          );
        }

        inputSkus.add(variantInput.sku);

        const existingSku =
          await this.productRepository.findBySku(variantInput.sku);

        if (existingSku) {
          throw new AppError(
            `Product variant SKU "${variantInput.sku}" already exists`,
            409
          );
        }

        ProductAttributeValidator.validate(
          variantInput.attributes,
          variantAttributeDefinitions
        );

        variants.push(
          ProductVariant.create({
            sku: variantInput.sku,
            attributes: variantInput.attributes,
            price: Money.create(
              variantInput.price.amount,
              variantInput.price.currency
            ),
            active: true
          })
        );
      }
    } else {
      const existingSku =
        await this.productRepository.findBySku(input.sku);

      if (existingSku) {
        throw new AppError(
          `Product variant SKU "${input.sku}" already exists`,
          409
        );
      }

      variants.push(
        ProductVariant.create({
          sku: input.sku,
          attributes: {},
          price: Money.create(
            input.price.amount,
            input.price.currency
          ),
          active: true
        })
      );
    }

    const product = Product.create({
      name: input.name,
      slug: input.slug,
      description: input.description,
      categoryId: input.categoryId,
      attributes: input.attributes,
      hasVariants: input.hasVariants,
      variants,
      active: true
    });

    return this.productRepository.save(product);
  }
}