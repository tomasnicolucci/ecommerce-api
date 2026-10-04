import { PostgresCartRepository } from "../cart/infrastructure/persistence/postgres/repositories/postgres-cart-repository.js";
import { MongoProductRepository } from "../catalog/infrastructure/persistence/mongoose/repositories/mongo-product-repository.js";
import { PostgresCustomerRepository } from "../customers/infrastructure/persistence/postgres/repositories/postgres-customer-repository.js";
import { Checkout } from "./application/use-cases/checkout.js";
import { GetMyOrderById } from "./application/use-cases/get-my-order-by-id.js";
import { GetMyOrders } from "./application/use-cases/get-my-orders.js";
import { PostgresCheckoutRepository } from "./infrastructure/persistence/postgres/repositories/postgres-checkout-repository.js";
import { PostgresOrderRepository } from "./infrastructure/persistence/postgres/repositories/postgres-order-repository.js";
import { OrderController } from "./presentation/controllers/order-controller.js";

const customerRepository =
    new PostgresCustomerRepository();

const cartRepository =
    new PostgresCartRepository();

const productRepository =
    new MongoProductRepository();

const checkoutRepository =
    new PostgresCheckoutRepository();

const orderRepository =
    new PostgresOrderRepository();

const checkout =
    new Checkout(
        customerRepository,
        cartRepository,
        productRepository,
        checkoutRepository
    );

const getMyOrders =
    new GetMyOrders(
        customerRepository,
        orderRepository
    );

const getMyOrderById =
    new GetMyOrderById(
        customerRepository,
        orderRepository
    );

export const orderController =
    new OrderController(
        checkout,
        getMyOrders,
        getMyOrderById
    );