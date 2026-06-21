export const ADMIN_ROLES = new Set([
  "Admin",
  "Administrator",
  "Dean",
  "HOD",
  "Head of Department",
]);

export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && ADMIN_ROLES.has(role);
}

export function isTeacherRole(role: string | null | undefined): boolean {
  return role === "Teacher";
}
