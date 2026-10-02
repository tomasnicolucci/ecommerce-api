import type {
  NextFunction,
  Request,
  Response
} from "express";
import {
  describe,
  expect,
  it,
  vi
} from "vitest";
import type { PermissionRepository } from "../../../modules/access-control/domain/repositories/permission-repository.js";
import { createAuthorize } from "../../../modules/access-control/presentation/middlewares/authorize.js";

class FakePermissionRepository
  implements PermissionRepository
{
  constructor(
    private readonly allowed: boolean
  ) {}

  async hasPermission(
    _userId: string,
    _permission: string
  ): Promise<boolean> {
    return this.allowed;
  }
}

describe("authorize", () => {
  it("should allow a user with the required permission", async () => {
    const repository =
      new FakePermissionRepository(true);

    const authorize =
      createAuthorize(repository);

    const req = {
      auth: {
        userId: "user-1",
        authUserId: "auth-user-1"
      }
    } as Request;

    const next = vi.fn();

    await authorize("catalog:manage")(
      req,
      {} as Response,
      next as NextFunction
    );

    expect(next).toHaveBeenCalledWith();
  });

  it("should return forbidden when permission is missing", async () => {
    const repository =
      new FakePermissionRepository(false);

    const authorize =
      createAuthorize(repository);

    const req = {
      auth: {
        userId: "user-1",
        authUserId: "auth-user-1"
      }
    } as Request;

    const next = vi.fn();

    await authorize("catalog:manage")(
      req,
      {} as Response,
      next as NextFunction
    );

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(403);
    expect(error.message).toBe("Forbidden");
  });

  it("should return unauthorized without authentication", async () => {
    const repository =
      new FakePermissionRepository(true);

    const authorize =
      createAuthorize(repository);

    const next = vi.fn();

    await authorize("catalog:manage")(
      {} as Request,
      {} as Response,
      next as NextFunction
    );

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Unauthorized");
  });
});