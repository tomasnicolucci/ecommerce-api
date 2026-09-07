import type {
  ErrorRequestHandler
} from "express";
import { ZodError } from "zod";
import { AppError } from "../../domain/errors/app-error.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation error",
      errors: error.issues
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    message: "Internal server error"
  });
};