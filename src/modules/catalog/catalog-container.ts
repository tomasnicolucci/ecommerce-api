import { CreateCategory } from "./application/use-cases/create-category.js";
import { MongoCategoryRepository } from "./infrastructure/persistence/mongoose/mongo-category-repository.js";
import { CreateCategoryController } from "./presentation/controllers/create-category-controller.js";
import { GetCategories } from "./application/use-cases/get-categories.js";
import { GetCategoryById } from "./application/use-cases/get-category-by-id.js";
import { GetCategoriesController } from "./presentation/controllers/get-categories-controller.js";
import { GetCategoryByIdController } from "./presentation/controllers/get-category-by-id-controller.js";
import { UpdateCategory } from "./application/use-cases/update-category.js";
import { UpdateCategoryController } from "./presentation/controllers/update-category-controller.js";
import { DeactivateCategory } from "./application/use-cases/deactivate-category.js";
import { DeactivateCategoryController } from "./presentation/controllers/deactivate-category-controller.js";

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