import type {
  EcommerceUser,
  UserRepository
} from "../../domain/repositories/user-repository.js";
import type { AccessTokenVerifier } from "../../domain/services/access-token-verifier.js";

export class AuthenticateUser {
  constructor(
    private readonly accessTokenVerifier: AccessTokenVerifier,
    private readonly userRepository: UserRepository
  ) {}

  async execute(
    token: string
  ): Promise<EcommerceUser> {
    const verifiedToken =
      await this.accessTokenVerifier.verify(token);

    const existingUser =
      await this.userRepository.findByAuthUserId(
        verifiedToken.authUserId
      );

    if (existingUser) {
      return existingUser;
    }

    return this.userRepository.create(
      verifiedToken.authUserId
    );
  }
}