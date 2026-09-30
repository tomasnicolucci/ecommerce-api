import { MongoProductRepository } from "../catalog/infrastructure/persistence/mongoose/repositories/mongo-product-repository.js";
import { PostgresInventoryRepository } from "../inventory/infrastructure/persistence/postgres/repositories/postgres-inventory-repository.js";
import { GetActiveCart } from "./application/use-cases/cart/get-active-cart.js";
import { AddCartItem } from "./application/use-cases/cart/add-cart-item.js";
import { UpdateCartItemQuantity } from "./application/use-cases/cart/update-cart-item-quantity.js";
import { RemoveCartItem } from "./application/use-cases/cart/remove-cart-item.js";
import { PostgresCartRepository } from "./infrastructure/persistence/postgres/repositories/postgres-cart-repository.js";
import { CartController } from "./presentation/controllers/cart-controller.js";

const cartRepository = new PostgresCartRepository();
const productRepository = new MongoProductRepository();
const inventoryRepository = new PostgresInventoryRepository();
const getActiveCart = new GetActiveCart(cartRepository);
const addCartItem = new AddCartItem(cartRepository, productRepository, inventoryRepository);
const updateCartItemQuantity = new UpdateCartItemQuantity(cartRepository, inventoryRepository);
const removeCartItem = new RemoveCartItem(cartRepository);

export const cartController = new CartController(getActiveCart, addCartItem, updateCartItemQuantity, removeCartItem);