import { AppError } from "../../../../shared/domain/errors/app-error.js";
import type { ProductRepository } from "../../../catalog/domain/repositories/product-repository.js";
import type { CartRepository } from "../../../cart/domain/repositories/cart-repository.js";
import type { CustomerRepository } from "../../../customers/domain/repositories/customer-repository.js";
import type {
  CheckoutItemSnapshot,
  CheckoutRepository,
  CheckoutResult
} from "../../domain/repositories/checkout-repository.js";

export class Checkout {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
    private readonly checkoutRepository: CheckoutRepository
  ) { }

  async execute(
    userId: string
  ): Promise<CheckoutResult> {
    const customer =
      await this.customerRepository.findByUserId(
        userId
      );

    if (!customer) {
      throw new AppError(
        "Customer not found",
        404
      );
    }

    if (!customer.id) {
      throw new AppError(
        "Customer id is required",
        500
      );
    }

    const cart =
      await this.cartRepository.findActiveByCustomerId(
        customer.id
      );

    if (!cart) {
      throw new AppError(
        "Active cart not found",
        404
      );
    }

    if (!cart.id) {
      throw new AppError(
        "Cart id is required",
        500
      );
    }

    if (cart.items.length === 0) {
      throw new AppError(
        "Cart is empty",
        400
      );
    }

    const snapshots: CheckoutItemSnapshot[] =
      [];

    for (const cartItem of cart.items) {
      const product =
        await this.productRepository.findByVariantId(
          cartItem.variantId
        );

      if (!product) {
        throw new AppError(
          "Product not found",
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
          (candidate) =>
            candidate.id ===
            cartItem.variantId
        );

      if (!variant) {
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
        variantId: cartItem.variantId,
        productId: product.id!,
        productName: product.name,
        sku: variant.sku,
        unitPrice: variant.price.amount,
        currency: variant.price.currency,
        quantity: cartItem.quantity
      });
    }

    const currency =
      snapshots[0].currency;

    const hasDifferentCurrency =
      snapshots.some(
        (item) =>
          item.currency !== currency
      );

    if (hasDifferentCurrency) {
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