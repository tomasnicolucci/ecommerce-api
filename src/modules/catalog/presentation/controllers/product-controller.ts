import type { Request, Response } from "express";
import { CreateProduct } from "../../application/use-cases/product/create-product.js";
import { GetProductById } from "../../application/use-cases/product/get-product-by-id.js";
import { GetProducts } from "../../application/use-cases/product/get-products.js";
import { ProductResponseMapper } from "../mappers/product-response-mapper.js";
import { UpdateProduct } from "../../application/use-cases/product/update-product.js";
import { DeleteProduct } from "../../application/use-cases/product/delete-product.js";

export class ProductController {
  constructor(
    private readonly createProduct: CreateProduct,
    private readonly getProducts: GetProducts,
    private readonly getProductById: GetProductById,
    private readonly updateProduct: UpdateProduct,
    private readonly deleteProduct: DeleteProduct
  ) { }

  create = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const product = await this.createProduct.execute(req.body);

    res.status(201).json(
      ProductResponseMapper.toResponse(product)
    );
  };

  getAll = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    const products = await this.getProducts.execute();

    res.status(200).json(
      products.map((product) =>
        ProductResponseMapper.toResponse(product)
      )
    );
  };

  getById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = req.params.id;

    if (typeof id !== "string") {
      throw new Error("Invalid product id");
    }

    const product = await this.getProductById.execute(id);

    res.status(200).json(
      ProductResponseMapper.toResponse(product)
    );
  };

  update = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = req.params.id;

    if (typeof id !== "string") {
      throw new Error("Invalid product id");
    }

    const product = await this.updateProduct.execute(
      id,
      req.body
    );

    res.status(200).json(
      ProductResponseMapper.toResponse(product)
    );
  };

  delete = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = req.params.id;

    if (typeof id !== "string") {
      throw new Error("Invalid product id");
    }

    await this.deleteProduct.execute(id);

    res.status(204).send();
  };
}