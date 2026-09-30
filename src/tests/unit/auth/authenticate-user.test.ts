import {
  beforeEach,
  describe,
  expect,
  it
} from "vitest";
import { AuthenticateUser } from "../../../modules/auth/application/services/authenticate-user.js";
import { FakeAccessTokenVerifier } from "../../helpers/fake-access-token-verifier.js";
import { InMemoryUserRepository } from "../../helpers/in-memory-user-repository.js";

describe("AuthenticateUser", () => {
  let userRepository: InMemoryUserRepository;

  beforeEach(() => {
    userRepository =
      new InMemoryUserRepository();
  });

  it("should create a local user when authenticated for the first time", async () => {
    const verifier =
      new FakeAccessTokenVerifier(
        "auth-user-1"
      );

    const authenticateUser =
      new AuthenticateUser(
        verifier,
        userRepository
      );

    const user =
      await authenticateUser.execute(
        "access-token"
      );

    expect(user.authUserId).toBe(
      "auth-user-1"
    );

    expect(userRepository.users).toHaveLength(1);
  });

  it("should return the existing local user", async () => {
    userRepository.users.push({
      id: "local-user-1",
      authUserId: "auth-user-1"
    });

    const verifier =
      new FakeAccessTokenVerifier(
        "auth-user-1"
      );

    const authenticateUser =
      new AuthenticateUser(
        verifier,
        userRepository
      );

    const user =
      await authenticateUser.execute(
        "access-token"
      );

    expect(user.id).toBe(
      "local-user-1"
    );

    expect(userRepository.users).toHaveLength(1);
  });
});