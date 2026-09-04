import type { Request, Response } from "express";
import { CreateCategory } from "../../application/use-cases/create-category.js";

export class CreateCategoryController {
  constructor(
    private readonly createCategory: CreateCategory
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
    const category = await this.createCategory.execute(req.body);

    res.status(201).json({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      attributes: category.attributes,
      active: category.active
    });
  }
}