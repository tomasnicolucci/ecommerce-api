import type {
  EcommerceUser,
  UserRepository
} from "../../modules/auth/domain/repositories/user-repository.js";

export class InMemoryUserRepository
  implements UserRepository
{
  public users: EcommerceUser[] = [];

  async findByAuthUserId(
    authUserId: string
  ): Promise<EcommerceUser | null> {
    return (
      this.users.find(
        (user) =>
          user.authUserId === authUserId
      ) ?? null
    );
  }

  async create(
    authUserId: string
  ): Promise<EcommerceUser> {
    const user = {
      id: `user-${this.users.length + 1}`,
      authUserId
    };

    this.users.push(user);

    return user;
  }
}