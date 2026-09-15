import type { Request, Response } from "express";
import { CreateProduct } from "../../application/use-cases/product/create-product.js";

export class ProductController {
  constructor(
    private readonly createProduct: CreateProduct
  ) {}

  create = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const product = await this.createProduct.execute(req.body);

    res.status(201).json(product);
  };
}