import { CreateInventoryItem } from "./application/use-cases/inventory/create-inventory-item.js";
import { GetInventoryByVariantId } from "./application/use-cases/inventory/get-inventory-by-variant-id.js";
import { AdjustStock } from "./application/use-cases/inventory/adjust-stock.js";
import { PostgresInventoryRepository } from "./infrastructure/persistence/postgres/repositories/postgres-inventory-repository.js";
import { InventoryController } from "./presentation/controllers/inventory-controller.js";
import { MongoProductRepository } from "../catalog/infrastructure/persistence/mongoose/repositories/mongo-product-repository.js";

const inventoryRepository = new PostgresInventoryRepository();
const productRepository = new MongoProductRepository();
const createInventoryItem = new CreateInventoryItem(inventoryRepository, productRepository);
const getInventoryByVariantId = new GetInventoryByVariantId(inventoryRepository);
const adjustStock = new AdjustStock(inventoryRepository);

export const inventoryController = new InventoryController(createInventoryItem, getInventoryByVariantId, adjustStock);