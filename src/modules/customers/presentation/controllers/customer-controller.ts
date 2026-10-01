import type { Request, Response } from "express";
import { AppError } from "../../../../shared/domain/errors/app-error.js";
import type { CreateCustomer } from "../../application/use-cases/customer/create-customer.js";
import type { GetCustomerByUserId } from "../../application/use-cases/customer/get-customer-by-user-id.js";
import type { UpdateCustomer } from "../../application/use-cases/customer/update-customer.js";
import { CustomerResponseMapper } from "../mappers/customer-response-mapper.js";

export class CustomerController {
  constructor(
    private readonly createCustomer: CreateCustomer,
    private readonly getCustomerByUserId: GetCustomerByUserId,
    private readonly updateCustomer: UpdateCustomer
  ) {}

  create = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    if (!req.auth) {
      throw new AppError("Unauthorized", 401);
    }

    const customer =
      await this.createCustomer.execute({
        userId: req.auth.userId,
        firstName: req.body.firstName,
        lastName: req.body.lastName
      });

    res.status(201).json(
      CustomerResponseMapper.toResponse(customer)
    );
  };

  getMe = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    if (!req.auth) {
      throw new AppError("Unauthorized", 401);
    }

    const customer =
      await this.getCustomerByUserId.execute(
        req.auth.userId
      );

    res.status(200).json(
      CustomerResponseMapper.toResponse(customer)
    );
  };

  updateMe = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    if (!req.auth) {
      throw new AppError("Unauthorized", 401);
    }

    const customer =
      await this.updateCustomer.execute(
        req.auth.userId,
        req.body
      );

    res.status(200).json(
      CustomerResponseMapper.toResponse(customer)
    );
  };
}