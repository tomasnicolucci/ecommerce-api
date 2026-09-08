import type { Request, Response } from "express";
import { GetCategories } from "../../application/use-cases/get-categories.js";

export class GetCategoriesController {
  constructor(
    private readonly getCategories: GetCategories
  ) {}

  async handle(_req: Request, res: Response): Promise<void> {
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
  }
}