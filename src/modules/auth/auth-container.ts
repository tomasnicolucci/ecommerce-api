import { AuthenticateUser } from "./application/services/authenticate-user.js";
import { JoseAccessTokenVerifier } from "./infrastructure/jwt/jose-access-token-verifier.js";
import { PostgresUserRepository } from "./infrastructure/persistence/postgres/repositories/postgres-user-repository.js";
import { createAuthenticateMiddleware } from "./presentation/middlewares/authenticate.js";

const accessTokenVerifier = new JoseAccessTokenVerifier();
const userRepository = new PostgresUserRepository();
const authenticateUser = new AuthenticateUser(accessTokenVerifier, userRepository);

export const authenticate = createAuthenticateMiddleware(authenticateUser);