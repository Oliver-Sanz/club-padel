export type ProfileRole = "user" | "player" | "admin" | "super_admin";

export function isPlayerRole(role: string | null | undefined) {
  return role === "user" || role === "player";
}

export function isClubAdminRole(role: string | null | undefined) {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdminRole(role: string | null | undefined) {
  return role === "super_admin";
}

