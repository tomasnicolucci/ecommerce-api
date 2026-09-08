import type { Request, Response } from "express";
import { GetCategoryById } from "../../application/use-cases/get-category-by-id.js";

export class GetCategoryByIdController {
  constructor(
    private readonly getCategoryById: GetCategoryById
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
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
  }
}