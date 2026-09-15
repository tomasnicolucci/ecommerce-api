import { Router } from "express";
import { CreateProduct } from "../../application/use-cases/product/create-product.js";
import { MongoCategoryRepository } from "../../infrastructure/persistence/mongoose/repositories/mongo-category-repository.js";
import { MongoProductRepository } from "../../infrastructure/persistence/mongoose/repositories/mongo-product-repository.js";
import { ProductController } from "../controllers/product-controller.js";
import { validate } from "../../../../shared/presentation/middlewares/validate.js";
import { createProductSchema } from "../validators/product-validator.js";

const productRouter = Router();

const productRepository = new MongoProductRepository();
const categoryRepository = new MongoCategoryRepository();

const createProduct = new CreateProduct(
  productRepository,
  categoryRepository
);

const productController = new ProductController(
  createProduct
);

productRouter.post(
  "/",
  validate(createProductSchema),
  productController.create
);

export { productRouter };