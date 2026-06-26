import type { UserRole } from "@/lib/types";

const permissions: Record<UserRole, string[]> = {
  customer: ["order:create", "order:read-own", "review:create", "chat:use", "escort:apply"],
  escort: ["order:accept", "order:manage-own", "withdraw:create", "chat:use"],
  admin: ["admin:read", "admin:manage-users", "admin:manage-orders", "admin:manage-withdraws", "admin:manage-applications"],
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
