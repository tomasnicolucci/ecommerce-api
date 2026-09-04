import { CreateCategory } from "./application/use-cases/create-category.js";
import { MongoCategoryRepository } from "./infrastructure/persistence/mongoose/mongo-category-repository.js";
import { CreateCategoryController } from "./presentation/controllers/create-category-controller.js";

const categoryRepository = new MongoCategoryRepository();

const createCategory = new CreateCategory(categoryRepository);

export const createCategoryController = new CreateCategoryController(createCategory);