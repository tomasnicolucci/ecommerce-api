import type { Request, Response } from "express";
import { AppError } from "../../../../shared/domain/errors/app-error.js";
import type { ManagePromotions } from "../../application/use-cases/manage-promotions.js";
import type { Promotion } from "../../domain/entities/promotion.js";

const toResponse = (promotion: Promotion) => ({
    id: promotion.id,
    ...promotion.data
});

export class PromotionController {
    constructor(
        private readonly managePromotions: ManagePromotions
    ) { }

    create = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const promotion = await this.managePromotions.create(
            req.body
        );

        res.status(201).json(toResponse(promotion));
    };

    list = async (
        _req: Request,
        res: Response
    ): Promise<void> => {
        const promotions = await this.managePromotions.list();

        res.status(200).json(promotions.map(toResponse));
    };

    get = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const id = req.params.id;

        if (typeof id !== "string") {
            throw new AppError("Invalid promotion id", 400);
        }

        const promotion = await this.managePromotions.get(id);

        res.status(200).json(toResponse(promotion));
    };

    update = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const id = req.params.id;

        if (typeof id !== "string") {
            throw new AppError("Invalid promotion id", 400);
        }

        const promotion = await this.managePromotions.update(
            id,
            req.body
        );

        res.status(200).json(toResponse(promotion));
    };

    deactivate = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const id = req.params.id;

        if (typeof id !== "string") {
            throw new AppError("Invalid promotion id", 400);
        }

        await this.managePromotions.deactivate(id);

        res.status(204).send();
    };
}