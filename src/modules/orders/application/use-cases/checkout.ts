import { AppError } from "../../../../shared/domain/errors/app-error.js";
import type { CartRepository } from "../../../cart/domain/repositories/cart-repository.js";
import type { ProductRepository } from "../../../catalog/domain/repositories/product-repository.js";
import type { CustomerRepository } from "../../../customers/domain/repositories/customer-repository.js";
import type { Order } from "../../domain/entities/order.js";
import type {
  CheckoutItemSnapshot,
  CheckoutRepository
} from "../../domain/repositories/checkout-repository.js";

export class Checkout {
  constructor(
    private readonly customerRepository:
      CustomerRepository,
    private readonly cartRepository:
      CartRepository,
    private readonly productRepository:
      ProductRepository,
    private readonly checkoutRepository:
      CheckoutRepository
  ) {}

  async execute(
    userId: string
  ): Promise<Order> {
    const customer =
      await this.customerRepository.findByUserId(
        userId
      );

    if (!customer || !customer.id) {
      throw new AppError(
        "Customer not found",
        404
      );
    }

    const cart =
      await this.cartRepository.findActiveByCustomerId(
        customer.id
      );

    if (!cart || !cart.id) {
      throw new AppError(
        "Active cart not found",
        404
      );
    }

    if (cart.items.length === 0) {
      throw new AppError(
        "Cart is empty",
        400
      );
    }

    const snapshots:
      CheckoutItemSnapshot[] = [];

    for (const cartItem of cart.items) {
      const product =
        await this.productRepository.findByVariantId(
          cartItem.variantId
        );

      if (!product || !product.id) {
        throw new AppError(
          "Product not found for cart item",
          404
        );
      }

      if (!product.active) {
        throw new AppError(
          "Product is not active",
          409
        );
      }

      const variant =
        product.variants.find(
          (currentVariant) =>
            currentVariant.id ===
            cartItem.variantId
        );

      if (!variant || !variant.id) {
        throw new AppError(
          "Product variant not found",
          404
        );
      }

      if (!variant.active) {
        throw new AppError(
          "Product variant is not active",
          409
        );
      }

      snapshots.push({
        variantId:
          variant.id,
        productId:
          product.id,
        productName:
          product.name,
        sku:
          variant.sku,
        unitPrice:
          variant.price.amount,
        currency:
          variant.price.currency,
        quantity:
          cartItem.quantity
      });
    }

    const currencies =
      new Set(
        snapshots.map(
          (item) => item.currency
        )
      );

    if (currencies.size !== 1) {
      throw new AppError(
        "Cart items must use the same currency",
        400
      );
    }

    return this.checkoutRepository.checkout(
      customer.id,
      cart.id,
      snapshots
    );
  }
}