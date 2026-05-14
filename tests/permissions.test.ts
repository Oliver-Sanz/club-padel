import { describe, expect, it } from "vitest";
import { isClubAdminRole, isPlayerRole, isSuperAdminRole } from "@/lib/permissions";

describe("permission roles", () => {
  it("treats legacy users and players as player accounts", () => {
    expect(isPlayerRole("user")).toBe(true);
    expect(isPlayerRole("player")).toBe(true);
    expect(isPlayerRole("admin")).toBe(false);
  });

  it("allows admins and super admins to manage bookings", () => {
    expect(isClubAdminRole("admin")).toBe(true);
    expect(isClubAdminRole("super_admin")).toBe(true);
    expect(isClubAdminRole("player")).toBe(false);
  });

  it("reserves platform settings for super admins", () => {
    expect(isSuperAdminRole("super_admin")).toBe(true);
    expect(isSuperAdminRole("admin")).toBe(false);
    expect(isSuperAdminRole("player")).toBe(false);
  });
});

