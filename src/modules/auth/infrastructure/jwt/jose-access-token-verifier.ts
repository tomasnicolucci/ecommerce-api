import {
  createRemoteJWKSet,
  jwtVerify
} from "jose";
import { env } from "../../../../config/env.js";
import type {
  AccessTokenVerifier,
  VerifiedAccessToken
} from "../../domain/services/access-token-verifier.js";

export class JoseAccessTokenVerifier
  implements AccessTokenVerifier
{
  private readonly jwks = createRemoteJWKSet(
    new URL(env.AUTH_JWKS_URL)
  );

  async verify(
    token: string
  ): Promise<VerifiedAccessToken> {
    const { payload } = await jwtVerify(
      token,
      this.jwks,
      {
        issuer: env.AUTH_JWT_ISSUER,
        audience: env.AUTH_JWT_AUDIENCE,
        algorithms: ["RS256"]
      }
    );

    if (!payload.sub) {
      throw new Error(
        "Access token does not contain a subject"
      );
    }

    return {
      authUserId: payload.sub
    };
  }
}