import type { Request, Response } from "express";
import { DeactivateCategory } from "../../application/use-cases/deactivate-category.js";

export class DeactivateCategoryController {
  constructor(
    private readonly deactivateCategory: DeactivateCategory
  ) {}

  async handle(req: Request, res: Response): Promise<void> {
    const id = req.params.id;

    if (typeof id !== "string") {
      throw new Error("Invalid category id");
    }

    await this.deactivateCategory.execute(id);

    res.status(204).send();
  }
}