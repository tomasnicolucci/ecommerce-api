import { CreateCategory } from "./application/use-cases/category/create-category.js";
import { MongoCategoryRepository } from "./infrastructure/persistence/mongoose/repositories/mongo-category-repository.js";
import { GetCategories } from "./application/use-cases/category/get-categories.js";
import { GetCategoryById } from "./application/use-cases/category/get-category-by-id.js";
import { UpdateCategory } from "./application/use-cases/category/update-category.js";
import { DeactivateCategory } from "./application/use-cases/category/deactivate-category.js";
import { DeactivateCategoryController, UpdateCategoryController, GetCategoryByIdController, GetCategoriesController, CreateCategoryController } from "./presentation/controllers/category-controller.js";

const categoryRepository = new MongoCategoryRepository();
const createCategory = new CreateCategory(categoryRepository);
const getCategories = new GetCategories(categoryRepository);
const getCategoryById = new GetCategoryById(categoryRepository);
const updateCategory = new UpdateCategory(categoryRepository);
const deactivateCategory = new DeactivateCategory(categoryRepository);

export const createCategoryController = new CreateCategoryController(createCategory);
export const getCategoriesController = new GetCategoriesController(getCategories);
export const getCategoryByIdController = new GetCategoryByIdController(getCategoryById);
export const updateCategoryController = new UpdateCategoryController(updateCategory);
export const deactivateCategoryController = new DeactivateCategoryController(deactivateCategory);