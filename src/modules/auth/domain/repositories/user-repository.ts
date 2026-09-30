export interface EcommerceUser {
  id: string;
  authUserId: string;
}

export interface UserRepository {
  findByAuthUserId(
    authUserId: string
  ): Promise<EcommerceUser | null>;

  create(
    authUserId: string
  ): Promise<EcommerceUser>;
}