import { describe, expect, it } from "vitest";
import { ADMIN_EMAIL, isAdministratorEmail } from "@/lib/admin-identity";

describe("administrator identity", () => {
  it("uses the HanGo account as the only administrator identity", () => {
    expect(ADMIN_EMAIL).toBe("hango.learn@gmail.com");
    expect(isAdministratorEmail("hango.learn@gmail.com")).toBe(true);
    expect(isAdministratorEmail(" HANGO.LEARN@GMAIL.COM ")).toBe(true);
  });

  it("does not authorize the previous administrator email", () => {
    expect(isAdministratorEmail("arean.mendoza@unmsm.edu.pe")).toBe(false);
    expect(isAdministratorEmail(null)).toBe(false);
  });
});
