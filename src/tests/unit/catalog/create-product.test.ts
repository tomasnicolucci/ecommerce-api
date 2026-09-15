import { beforeEach, describe, expect, it } from "vitest";
import { CreateProduct } from "../../../modules/catalog/application/use-cases/product/create-product.js";
import { Category } from "../../../modules/catalog/domain/entities/category.js";
import { InMemoryCategoryRepository } from "../../helpers/in-memory-category-repository.js";
import { InMemoryProductRepository } from "../../helpers/in-memory-product-repository.js";

describe("CreateProduct", () => {
  let productRepository: InMemoryProductRepository;
  let categoryRepository: InMemoryCategoryRepository;
  let createProduct: CreateProduct;

  beforeEach(() => {
    productRepository = new InMemoryProductRepository();
    categoryRepository = new InMemoryCategoryRepository();

    createProduct = new CreateProduct(
      productRepository,
      categoryRepository
    );

    categoryRepository.categories.push(
      Category.restore("laptops-category", {
        name: "Laptops",
        slug: "laptops",
        parentId: null,
        attributes: [
          {
            name: "brand",
            type: "string",
            scope: "product",
            required: true
          },
          {
            name: "processor",
            type: "string",
            scope: "product",
            required: true
          },
          {
            name: "ram",
            type: "select",
            scope: "variant",
            required: true,
            options: ["8GB", "16GB", "32GB"]
          },
          {
            name: "storage",
            type: "select",
            scope: "variant",
            required: true,
            options: ["256GB", "512GB", "1TB"]
          }
        ],
        active: true
      })
    );
  });

  it("should create a product", async () => {
    const product = await createProduct.execute({
      name: "ThinkPad E14",
      slug: "thinkpad-e14",
      description: "Business laptop",
      categoryId: "laptops-category",
      attributes: {
        brand: "Lenovo",
        processor: "Ryzen 7"
      },
      variants: [
        {
          sku: "LEN-E14-16-512",
          attributes: {
            ram: "16GB",
            storage: "512GB"
          },
          price: {
            amount: 1200,
            currency: "USD"
          }
        }
      ]
    });

    expect(product.id).not.toBeNull();
    expect(product.name).toBe("ThinkPad E14");
    expect(product.variants).toHaveLength(1);
    expect(product.variants[0]?.sku).toBe("LEN-E14-16-512");
    expect(productRepository.products).toHaveLength(1);
  });

  it("should not create a product with an existing slug", async () => {
    const input = {
      name: "ThinkPad E14",
      slug: "thinkpad-e14",
      description: "Business laptop",
      categoryId: "laptops-category",
      attributes: {
        brand: "Lenovo",
        processor: "Ryzen 7"
      },
      variants: [
        {
          sku: "LEN-E14-16-512",
          attributes: {
            ram: "16GB",
            storage: "512GB"
          },
          price: {
            amount: 1200,
            currency: "USD"
          }
        }
      ]
    };

    await createProduct.execute(input);

    await expect(
      createProduct.execute({
        ...input,
        variants: [
          {
            ...input.variants[0]!,
            sku: "LEN-E14-OTHER"
          }
        ]
      })
    ).rejects.toThrow("Product slug already exists");
  });

  it("should not create a product with a non-existing category", async () => {
    await expect(
      createProduct.execute({
        name: "ThinkPad E14",
        slug: "thinkpad-e14",
        description: "",
        categoryId: "non-existing-category",
        attributes: {
          brand: "Lenovo",
          processor: "Ryzen 7"
        },
        variants: []
      })
    ).rejects.toThrow("Category not found");
  });

  it("should reject invalid product attributes", async () => {
    await expect(
      createProduct.execute({
        name: "ThinkPad E14",
        slug: "thinkpad-e14",
        description: "",
        categoryId: "laptops-category",
        attributes: {
          brand: "Lenovo"
        },
        variants: []
      })
    ).rejects.toThrow('Attribute "processor" is required');
  });

  it("should reject invalid variant attributes", async () => {
    await expect(
      createProduct.execute({
        name: "ThinkPad E14",
        slug: "thinkpad-e14",
        description: "",
        categoryId: "laptops-category",
        attributes: {
          brand: "Lenovo",
          processor: "Ryzen 7"
        },
        variants: [
          {
            sku: "LEN-E14-64-512",
            attributes: {
              ram: "64GB",
              storage: "512GB"
            },
            price: {
              amount: 1200,
              currency: "USD"
            }
          }
        ]
      })
    ).rejects.toThrow('Attribute "ram" has an invalid option');
  });
});