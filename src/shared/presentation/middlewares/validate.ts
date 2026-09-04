import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

type RequestData = {
  body?: unknown;
  params?: unknown;
  query?: unknown;
};

export const validate =
  (schema: ZodType<RequestData>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      next(result.error);
      return;
    }

    if (result.data.body !== undefined) {
      req.body = result.data.body;
    }

    next();
  };