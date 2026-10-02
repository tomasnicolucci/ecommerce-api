import type {
  NextFunction,
  Request,
  RequestHandler,
  Response
} from "express";
import { AppError } from "../../../../shared/domain/errors/app-error.js";
import type { PermissionRepository } from "../../domain/repositories/permission-repository.js";

export const createAuthorize = (
  permissionRepository: PermissionRepository
) => {
  return (
    permission: string
  ): RequestHandler => {
    return async (
      req: Request,
      _res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        if (!req.auth) {
          throw new AppError("Unauthorized", 401);
        }

        const allowed =
          await permissionRepository.hasPermission(
            req.auth.userId,
            permission
          );

        if (!allowed) {
          throw new AppError("Forbidden", 403);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  };
};