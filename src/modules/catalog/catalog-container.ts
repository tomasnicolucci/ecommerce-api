// CATEGORY

import { CreateCategory } from "./application/use-cases/category/create-category.js";
import { MongoCategoryRepository } from "./infrastructure/persistence/mongoose/repositories/mongo-category-repository.js";
import { GetCategories } from "./application/use-cases/category/get-categories.js";
import { GetCategoryById } from "./application/use-cases/category/get-category-by-id.js";
import { UpdateCategory } from "./application/use-cases/category/update-category.js";
import { DeactivateCategory } from "./application/use-cases/category/deactivate-category.js";
import { CategoryController } from "./presentation/controllers/category-controller.js";

const categoryRepository = new MongoCategoryRepository();
const createCategory = new CreateCategory(categoryRepository);
const getCategories = new GetCategories(categoryRepository);
const getCategoryById = new GetCategoryById(categoryRepository);
const updateCategory = new UpdateCategory(categoryRepository);
const deactivateCategory = new DeactivateCategory(categoryRepository);

export const categoryController = new CategoryController(createCategory, getCategories, getCategoryById, updateCategory, deactivateCategory);

// PRODUCT

import { CreateProduct } from "./application/use-cases/product/create-product.js";
import { GetProducts } from "./application/use-cases/product/get-products.js";
import { GetProductById } from "./application/use-cases/product/get-product-by-id.js";
import { UpdateProduct } from "./application/use-cases/product/update-product.js";
import { DeleteProduct } from "./application/use-cases/product/delete-product.js";
import { MongoProductRepository } from "./infrastructure/persistence/mongoose/repositories/mongo-product-repository.js";
import { ProductController } from "./presentation/controllers/product-controller.js";

const productRepository = new MongoProductRepository();
const createProduct = new CreateProduct(productRepository, categoryRepository);
const getProducts = new GetProducts(productRepository);
const getProductById = new GetProductById(productRepository);
const updateProduct = new UpdateProduct(productRepository, categoryRepository);
const deleteProduct = new DeleteProduct(productRepository);

export const productController = new ProductController(createProduct, getProducts, getProductById, updateProduct, deleteProduct);
