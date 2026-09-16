import { Product } from "../../modules/catalog/domain/entities/product.js";
import type { ProductRepository } from "../../modules/catalog/domain/repositories/product-repository.js";

export class InMemoryProductRepository implements ProductRepository {
  public products: Product[] = [];

  async findById(id: string): Promise<Product | null> {
    return this.products.find((product) => product.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.products.find((product) => product.slug === slug) ?? null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    return (
      this.products.find((product) =>
        product.variants.some((variant) => variant.sku === sku)
      ) ?? null
    );
  }

  async findAll(): Promise<Product[]> {
    return this.products;
  }

  async save(product: Product): Promise<Product> {
    const savedProduct = Product.restore(
      product.id ?? `product-${this.products.length + 1}`,
      {
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId: product.categoryId,
        attributes: product.attributes,
        variants: product.variants,
        active: product.active
      }
    );

    this.products.push(savedProduct);

    return savedProduct;
  }

  async update(product: Product): Promise<void> {
    const index = this.products.findIndex(
      (currentProduct) => currentProduct.id === product.id
    );

    if (index !== -1) {
      this.products[index] = product;
    }
  }

  async delete(id: string): Promise<void> {
    this.products = this.products.filter(
      (product) => product.id !== id
    );
  }
}