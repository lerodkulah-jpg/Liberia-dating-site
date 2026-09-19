export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "SUPPORT_AGENT" | "FINANCE_MANAGER" | "CONTENT_MANAGER";

export type AdminPermission = "dashboard" | "view_users" | "manage_users" | "verify_profiles" | "view_reports" | "manage_subscriptions" | "manage_gifts" | "manage_boosts" | "manage_content";

const permissions: Record<AdminRole, AdminPermission[]> = {
  SUPER_ADMIN: ["dashboard", "view_users", "manage_users", "verify_profiles", "view_reports", "manage_subscriptions", "manage_gifts", "manage_boosts", "manage_content"],
  ADMIN: ["dashboard", "view_users", "manage_users", "verify_profiles", "view_reports", "manage_subscriptions", "manage_gifts", "manage_boosts", "manage_content"],
  MODERATOR: ["dashboard", "view_users", "manage_users", "verify_profiles", "view_reports"],
  SUPPORT_AGENT: ["dashboard", "view_users"],
  FINANCE_MANAGER: ["dashboard", "view_users", "manage_subscriptions", "manage_gifts", "manage_boosts"],
  CONTENT_MANAGER: ["dashboard", "view_users", "verify_profiles", "manage_gifts", "manage_content"],
};

export function isAdminRole(role: string): role is AdminRole {
  return role in permissions;
}

export function can(role: string, permission: AdminPermission) {
  return isAdminRole(role) && permissions[role].includes(permission);
}
