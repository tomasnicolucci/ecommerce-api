import type { Request, Response } from "express";
import { CreateCategory } from "../../application/use-cases/category/create-category.js";
import { DeactivateCategory } from "../../application/use-cases/category/deactivate-category.js";
import { UpdateCategory } from "../../application/use-cases/category/update-category.js";
import { GetCategoryById } from "../../application/use-cases/category/get-category-by-id.js";
import { GetCategories } from "../../application/use-cases/category/get-categories.js";

export class CategoryController {
  constructor(
    private readonly createCategory: CreateCategory,
    private readonly getCategories: GetCategories,
    private readonly getCategoryById: GetCategoryById,
    private readonly updateCategory: UpdateCategory,
    private readonly deactivateCategory: DeactivateCategory
  ) {}

  create = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const category = await this.createCategory.execute(req.body);

    res.status(201).json({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      attributes: category.attributes,
      active: category.active
    });
  };

  getAll = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    const categories = await this.getCategories.execute();

    res.status(200).json(
      categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        attributes: category.attributes,
        active: category.active
      }))
    );
  };

  getById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = req.params.id;

    if (typeof id !== "string") {
      throw new Error("Invalid category id");
    }

    const category = await this.getCategoryById.execute(id);

    res.status(200).json({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      attributes: category.attributes,
      active: category.active
    });
  };

  update = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = req.params.id;

    if (typeof id !== "string") {
      throw new Error("Invalid category id");
    }

    const category = await this.updateCategory.execute(
      id,
      req.body
    );

    res.status(200).json({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      attributes: category.attributes,
      active: category.active
    });
  };

  deactivate = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = req.params.id;

    if (typeof id !== "string") {
      throw new Error("Invalid category id");
    }

    await this.deactivateCategory.execute(id);

    res.status(204).send();
  };
}