import type { Product } from "../../../../domain/entities/product.js";
import type { ProductRepository } from "../../../../domain/repositories/product-repository.js";
import { ProductMapper } from "../mappers/product-mapper.js";
import { ProductModel } from "../schemas/product-schema.js";

export class MongoProductRepository implements ProductRepository {
  async findById(id: string): Promise<Product | null> {
    const document = await ProductModel.findById(id);

    if (!document) {
      return null;
    }

    return ProductMapper.toDomain(document);
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const document = await ProductModel.findOne({ slug });

    if (!document) {
      return null;
    }

    return ProductMapper.toDomain(document);
  }

  async findBySku(sku: string): Promise<Product | null> {
    const document = await ProductModel.findOne({
      "variants.sku": sku
    });

    if (!document) {
      return null;
    }

    return ProductMapper.toDomain(document);
  }

  async findAll(): Promise<Product[]> {
    const documents = await ProductModel.find();

    return documents.map((document) =>
      ProductMapper.toDomain(document)
    );
  }

  async save(product: Product): Promise<Product> {
    const persistenceData =
      ProductMapper.toPersistence(product);

    const document = await ProductModel.create(
      persistenceData
    );

    return ProductMapper.toDomain(document);
  }

  async update(product: Product): Promise<void> {
    if (!product.id) {
      throw new Error("Product ID is required");
    }

    const persistenceData =
      ProductMapper.toPersistence(product);

    await ProductModel.findByIdAndUpdate(
      product.id,
      persistenceData
    );
  }
  
  async delete(id: string): Promise<void> {
    await ProductModel.findByIdAndDelete(id);
  }
}