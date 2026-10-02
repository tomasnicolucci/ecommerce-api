import express, {
  type RequestHandler
} from "express";
import { createCategoryRouter } from "../../modules/catalog/presentation/routes/category-routes.js";
import { createProductRouter } from "../../modules/catalog/presentation/routes/product-routes.js";
import { createInventoryRouter } from "../../modules/inventory/presentation/routes/inventory-routes.js";
import { postgresPool } from "../../shared/infrastructure/database/postgres.js";
import { errorHandler } from "../../shared/presentation/middlewares/error-handler.js";

export const createRbacTestApp = () => {
  let currentUserId: string | null = null;

  const fakeAuthenticate: RequestHandler = (
    req,
    _res,
    next
  ) => {
    if (currentUserId) {
      req.auth = {
        userId: currentUserId,
        authUserId: "test-auth-user"
      };
    }

    next();
  };

  const app = express();

  app.use(express.json());

  app.use(
    "/categories",
    createCategoryRouter(fakeAuthenticate)
  );

  app.use(
    "/products",
    createProductRouter(fakeAuthenticate)
  );

  app.use(
    "/inventory",
    createInventoryRouter(fakeAuthenticate)
  );

  app.use(errorHandler);

  return {
    app,

    authenticateAs(userId: string): void {
      currentUserId = userId;
    },

    clearAuthentication(): void {
      currentUserId = null;
    }
  };
};

export const createTestUser = async (
  roleName?: "admin" | "customer"
): Promise<string> => {
  const userResult =
    await postgresPool.query<{ id: string }>(
      `
        INSERT INTO users (auth_user_id)
        VALUES ($1)
        RETURNING id
      `,
      [
        `test-${roleName ?? "no-role"}-${Date.now()}-${Math.random()}`
      ]
    );

  const userId = userResult.rows[0].id;

  if (roleName) {
    await postgresPool.query(
      `
        INSERT INTO user_roles (
          user_id,
          role_id
        )
        SELECT
          $1,
          id
        FROM roles
        WHERE name = $2
      `,
      [userId, roleName]
    );
  }

  return userId;
};