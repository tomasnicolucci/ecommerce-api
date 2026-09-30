import type {
  AccessTokenVerifier,
  VerifiedAccessToken
} from "../../modules/auth/domain/services/access-token-verifier.js";

export class FakeAccessTokenVerifier
  implements AccessTokenVerifier
{
  constructor(
    private readonly authUserId: string
  ) {}

  async verify(
    _token: string
  ): Promise<VerifiedAccessToken> {
    return {
      authUserId: this.authUserId
    };
  }
}