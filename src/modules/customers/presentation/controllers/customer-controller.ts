import type { Request, Response } from "express";
import type { CreateCustomer } from "../../application/use-cases/customer/create-customer.js";
import type { GetCustomerById } from "../../application/use-cases/customer/get-customer-by-id.js";
import type { GetCustomerByUserId } from "../../application/use-cases/customer/get-customer-by-user-id.js";
import type { UpdateCustomer } from "../../application/use-cases/customer/update-customer.js";
import { CustomerResponseMapper } from "../mappers/customer-response-mapper.js";

export class CustomerController {
  constructor(
    private readonly createCustomer: CreateCustomer,
    private readonly getCustomerById: GetCustomerById,
    private readonly getCustomerByUserId: GetCustomerByUserId,
    private readonly updateCustomer: UpdateCustomer
  ) {}

  create = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const customer =
      await this.createCustomer.execute(req.body);

    res.status(201).json(
      CustomerResponseMapper.toResponse(customer)
    );
  };

  getById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = req.params.id;

    if (typeof id !== "string") {
      throw new Error("Invalid customer id");
    }

    const customer =
      await this.getCustomerById.execute(id);

    res.status(200).json(
      CustomerResponseMapper.toResponse(customer)
    );
  };

  getByUserId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const userId = req.params.userId;

    if (typeof userId !== "string") {
      throw new Error("Invalid user id");
    }

    const customer =
      await this.getCustomerByUserId.execute(userId);

    res.status(200).json(
      CustomerResponseMapper.toResponse(customer)
    );
  };

  update = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = req.params.id;

    if (typeof id !== "string") {
      throw new Error("Invalid customer id");
    }

    const customer =
      await this.updateCustomer.execute(
        id,
        req.body
      );

    res.status(200).json(
      CustomerResponseMapper.toResponse(customer)
    );
  };
}