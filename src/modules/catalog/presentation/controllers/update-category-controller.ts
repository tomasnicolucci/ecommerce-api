import type { Request, Response } from "express";
import { UpdateCategory } from "../../application/use-cases/update-category.js";

export class UpdateCategoryController {
  constructor(
    private readonly updateCategory: UpdateCategory
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
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
  }
}