import type { Request, Response } from "express";
import type { GetActiveCart } from "../../application/use-cases/cart/get-active-cart.js";
import type { AddCartItem } from "../../application/use-cases/cart/add-cart-item.js";
import type { UpdateCartItemQuantity } from "../../application/use-cases/cart/update-cart-item-quantity.js";
import type { RemoveCartItem } from "../../application/use-cases/cart/remove-cart-item.js";
import { CartResponseMapper } from "../mappers/cart-response-mapper.js";

export class CartController {
  constructor(
    private readonly getActiveCart: GetActiveCart,
    private readonly addCartItem: AddCartItem,
    private readonly updateCartItemQuantity: UpdateCartItemQuantity,
    private readonly removeCartItem: RemoveCartItem
  ) {}

  getActive = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const customerId = req.params.customerId;

    if (typeof customerId !== "string") {
      throw new Error("Invalid customer id");
    }

    const cart =
      await this.getActiveCart.execute(customerId);

    res.status(200).json(
      CartResponseMapper.toResponse(cart)
    );
  };

  addItem = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const customerId = req.params.customerId;

    if (typeof customerId !== "string") {
      throw new Error("Invalid customer id");
    }

    const cart = await this.addCartItem.execute({
      customerId,
      variantId: req.body.variantId,
      quantity: req.body.quantity
    });

    res.status(200).json(
      CartResponseMapper.toResponse(cart)
    );
  };

  updateItemQuantity = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const customerId = req.params.customerId;
    const variantId = req.params.variantId;

    if (
      typeof customerId !== "string" ||
      typeof variantId !== "string"
    ) {
      throw new Error("Invalid cart parameters");
    }

    const cart =
      await this.updateCartItemQuantity.execute({
        customerId,
        variantId,
        quantity: req.body.quantity
      });

    res.status(200).json(
      CartResponseMapper.toResponse(cart)
    );
  };

  removeItem = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const customerId = req.params.customerId;
    const variantId = req.params.variantId;

    if (
      typeof customerId !== "string" ||
      typeof variantId !== "string"
    ) {
      throw new Error("Invalid cart parameters");
    }

    const cart =
      await this.removeCartItem.execute({
        customerId,
        variantId
      });

    res.status(200).json(
      CartResponseMapper.toResponse(cart)
    );
  };
}