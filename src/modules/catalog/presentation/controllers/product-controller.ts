import type { Request, Response } from "express";
import { CreateProduct } from "../../application/use-cases/product/create-product.js";
import { GetProductById } from "../../application/use-cases/product/get-product-by-id.js";
import { GetProducts } from "../../application/use-cases/product/get-products.js";
import { ProductResponseMapper } from "../mappers/product-response-mapper.js";
import { UpdateProduct } from "../../application/use-cases/product/update-product.js";
import { DeleteProduct } from "../../application/use-cases/product/delete-product.js";
import { GetProductVariants } from "../../application/use-cases/product/get-product-variants.js";
import { GetProductVariantById } from "../../application/use-cases/product/get-product-variant-by-id.js";
import { ProductVariantResponseMapper } from "../mappers/product-variant-response-mapper.js";
import { CreateProductVariant } from "../../application/use-cases/product/create-product-variant.js";

export class ProductController {
  constructor(
    private readonly createProduct: CreateProduct,
    private readonly getProducts: GetProducts,
    private readonly getProductById: GetProductById,
    private readonly updateProduct: UpdateProduct,
    private readonly deleteProduct: DeleteProduct,
    private readonly getProductVariants: GetProductVariants,
    private readonly getProductVariantById: GetProductVariantById,
    private readonly createProductVariant: CreateProductVariant
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

  getVariants = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const productId = req.params.productId;

    if (typeof productId !== "string") {
      throw new Error("Invalid product id");
    }

    const variants = await this.getProductVariants.execute(productId);

    res.status(200).json(
      variants.map((variant) =>
        ProductVariantResponseMapper.toResponse(variant)
      )
    );
  };

  getVariantById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const productId = req.params.productId;
    const variantId = req.params.variantId;

    if (
      typeof productId !== "string" ||
      typeof variantId !== "string"
    ) {
      throw new Error("Invalid product or variant id");
    }

    const variant = await this.getProductVariantById.execute(
      productId,
      variantId
    );

    res.status(200).json(
      ProductVariantResponseMapper.toResponse(variant)
    );
  };

  createVariant = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const productId = req.params.productId;

    if (typeof productId !== "string") {
      throw new Error("Invalid product id");
    }

    const variant = await this.createProductVariant.execute(
      productId,
      req.body
    );

    res.status(201).json(
      ProductVariantResponseMapper.toResponse(variant)
    );
  };
}