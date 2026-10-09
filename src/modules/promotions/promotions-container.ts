import { ManagePromotions } from "./application/use-cases/manage-promotions.js";
import { PostgresPromotionRepository } from "./infrastructure/persistence/postgres/repositories/postgres-promotion-repository.js";
import { PromotionController } from "./presentation/controllers/promotion-controller.js";

const promotionRepository = new PostgresPromotionRepository();
const managePromotions = new ManagePromotions(promotionRepository);

export const promotionController = new PromotionController(managePromotions);