import { PostgresPermissionRepository } from "./infrastructure/persistence/postgres/repositories/postgres-permission-repository.js";
import { createAuthorize } from "./presentation/middlewares/authorize.js";

const permissionRepository = new PostgresPermissionRepository();

export const authorize = createAuthorize(permissionRepository);