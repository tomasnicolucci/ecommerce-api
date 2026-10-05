import { AppError } from "../../../../../shared/domain/errors/app-error.js";
import type { ProductRepository } from "../../../../catalog/domain/repositories/product-repository.js";
import type { InventoryRepository } from "../../../../inventory/domain/repositories/inventory-repository.js";
import { Cart } from "../../../domain/entities/cart.js";
import { CartItem } from "../../../domain/entities/cart-item.js";
import type { CartRepository } from "../../../domain/repositories/cart-repository.js";

interface AddCartItemInput {
  customerId: string;
  variantId: string;
  quantity: number;
}

export class AddCartItem {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
    private readonly inventoryRepository: InventoryRepository
  ) { }

  async execute(input: AddCartItemInput): Promise<Cart> {
    const product =
      await this.productRepository.findByVariantId(
        input.variantId
      );

    if (!product) {
      throw new AppError("Product variant not found", 404);
    }

    const variant = product.variants.find(
      (item) => item.id === input.variantId
    );

    if (!variant || !variant.active || !product.active) {
      throw new AppError(
        "Product variant is not available",
        400
      );
    }

    const inventory =
      await this.inventoryRepository.findByVariantId(
        input.variantId
      );

    if (!inventory) {
      throw new AppError("Inventory not found", 404);
    }

    let cart =
      await this.cartRepository.findActiveByCustomerId(
        input.customerId
      );

    if (!cart) {
      cart = await this.cartRepository.save(
        Cart.create(input.customerId)
      );
    }

    if (!cart.id) {
      throw new Error("Cart id is required");
    }

    const existingItem =
      await this.cartRepository.findItemByVariantId(
        cart.id,
        input.variantId
      );

    const finalQuantity =
      (existingItem?.quantity ?? 0) + input.quantity;

    if (finalQuantity > inventory.availableQuantity) {
      throw new AppError("Insufficient stock", 400);
    }

    if (existingItem) {
      existingItem.changeQuantity(finalQuantity);

      await this.cartRepository.updateItem(
        existingItem
      );
    } else {
      const cartItem = CartItem.create({
        cartId: cart.id,
        variantId: input.variantId,
        quantity: input.quantity
      });

      await this.cartRepository.addItem(cartItem);
    }

    const updatedCart =
      await this.cartRepository.findActiveByCustomerId(
        input.customerId
      );

    if (!updatedCart) {
      throw new Error("Active cart not found");
    }

    return updatedCart;
  }
}