export interface VerifiedAccessToken {
  authUserId: string;
}

export interface AccessTokenVerifier {
  verify(token: string): Promise<VerifiedAccessToken>;
}