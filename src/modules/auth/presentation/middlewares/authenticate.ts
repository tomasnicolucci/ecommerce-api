import type {
  NextFunction,
  Request,
  Response
} from "express";
import { AppError } from "../../../../shared/domain/errors/app-error.js";
import type { AuthenticateUser } from "../../application/services/authenticate-user.js";

export const createAuthenticateMiddleware = (
  authenticateUser: AuthenticateUser
) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authorization =
        req.headers.authorization;

      if (!authorization) {
        throw new AppError(
          "Authorization header is required",
          401
        );
      }

      const [scheme, token] =
        authorization.split(" ");

      if (
        scheme !== "Bearer" ||
        !token
      ) {
        throw new AppError(
          "Invalid authorization header",
          401
        );
      }

      let user;

      try {
        user =
          await authenticateUser.execute(token);
      } catch {
        throw new AppError(
          "Invalid or expired access token",
          401
        );
      }

      req.auth = {
        userId: user.id,
        authUserId: user.authUserId
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};