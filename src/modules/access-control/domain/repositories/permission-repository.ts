export interface PermissionRepository {
  hasPermission(
    userId: string,
    permission: string
  ): Promise<boolean>;
}