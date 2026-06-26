import type { UserRole } from "@/lib/types";

const permissions: Record<UserRole, string[]> = {
  player: ["order:create", "order:read-own", "review:create", "chat:use"],
  escort: ["order:accept", "order:manage-own", "withdraw:create", "chat:use"],
  admin: ["admin:read", "admin:manage-users", "admin:manage-orders", "admin:manage-withdraws"],
};

export function canAccess(role: UserRole | undefined, permission: string) {
  if (!role) {
    return false;
  }

  return permissions[role]?.includes(permission) || false;
}

export function requireRole(role: UserRole | undefined, allowedRoles: UserRole[]) {
  if (!role) {
    return false;
  }

  return allowedRoles.includes(role);
}
