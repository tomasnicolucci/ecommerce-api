import { MongoProductRepository } from "../catalog/infrastructure/persistence/mongoose/repositories/mongo-product-repository.js";
import { GetCustomerByUserId } from "../customers/application/use-cases/customer/get-customer-by-user-id.js";
import { PostgresCustomerRepository } from "../customers/infrastructure/persistence/postgres/repositories/postgres-customer-repository.js";
import { PostgresInventoryRepository } from "../inventory/infrastructure/persistence/postgres/repositories/postgres-inventory-repository.js";
import { AddCartItem } from "./application/use-cases/cart/add-cart-item.js";
import { GetActiveCart } from "./application/use-cases/cart/get-active-cart.js";
import { RemoveCartItem } from "./application/use-cases/cart/remove-cart-item.js";
import { UpdateCartItemQuantity } from "./application/use-cases/cart/update-cart-item-quantity.js";
import { PostgresCartRepository } from "./infrastructure/persistence/postgres/repositories/postgres-cart-repository.js";
import { CartController } from "./presentation/controllers/cart-controller.js";

const cartRepository = new PostgresCartRepository();
const productRepository = new MongoProductRepository();
const inventoryRepository = new PostgresInventoryRepository();
const customerRepository = new PostgresCustomerRepository();
const getCustomerByUserId = new GetCustomerByUserId(customerRepository);
const getActiveCart = new GetActiveCart(cartRepository);
const addCartItem = new AddCartItem(cartRepository, productRepository, inventoryRepository);
const updateCartItemQuantity = new UpdateCartItemQuantity(cartRepository, inventoryRepository);
const removeCartItem = new RemoveCartItem(cartRepository);

export const cartController = new CartController(getCustomerByUserId, getActiveCart, addCartItem, updateCartItemQuantity, removeCartItem);