import type { Request, Response } from "express";
import { AppError } from "../../../../shared/domain/errors/app-error.js";
import type { AddCartItem } from "../../application/use-cases/cart/add-cart-item.js";
import type { GetActiveCart } from "../../application/use-cases/cart/get-active-cart.js";
import type { RemoveCartItem } from "../../application/use-cases/cart/remove-cart-item.js";
import type { UpdateCartItemQuantity } from "../../application/use-cases/cart/update-cart-item-quantity.js";
import type { GetCustomerByUserId } from "../../../customers/application/use-cases/customer/get-customer-by-user-id.js";
import { CartResponseMapper } from "../mappers/cart-response-mapper.js";

export class CartController {
  constructor(
    private readonly getCustomerByUserId: GetCustomerByUserId,
    private readonly getActiveCart: GetActiveCart,
    private readonly addCartItem: AddCartItem,
    private readonly updateCartItemQuantity: UpdateCartItemQuantity,
    private readonly removeCartItem: RemoveCartItem
  ) {}

  private async getAuthenticatedCustomerId(
    req: Request
  ): Promise<string> {
    if (!req.auth) {
      throw new AppError("Unauthorized", 401);
    }

    const customer =
      await this.getCustomerByUserId.execute(
        req.auth.userId
      );

    if (!customer.id) {
      throw new AppError("Customer not found", 404);
    }

    return customer.id;
  }

  getActive = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const customerId =
      await this.getAuthenticatedCustomerId(req);

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
    const customerId =
      await this.getAuthenticatedCustomerId(req);

    const cart =
      await this.addCartItem.execute({
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
    const customerId =
      await this.getAuthenticatedCustomerId(req);

    const variantId = req.params.variantId;

    if (typeof variantId !== "string") {
      throw new Error("Invalid variant id");
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
    const customerId =
      await this.getAuthenticatedCustomerId(req);

    const variantId = req.params.variantId;

    if (typeof variantId !== "string") {
      throw new Error("Invalid variant id");
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