import type { Request, Response } from "express";
import { CreateProduct } from "../../application/use-cases/product/create-product.js";

export class ProductController {
  constructor(
    private readonly createProduct: CreateProduct
  ) { }

  create = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const product = await this.createProduct.execute(req.body);

    res.status(201).json({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      categoryId: product.categoryId,
      attributes: product.attributes,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        attributes: variant.attributes,
        price: {
          amount: variant.price.amount,
          currency: variant.price.currency
        },
        active: variant.active
      })),
      active: product.active
    });
  };
}