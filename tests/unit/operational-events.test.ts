import { describe, expect, it } from "vitest";
import {
  normalizedOperationalErrorCode,
  sanitizeOperationalRoute,
} from "@/lib/operational-events";

describe("operational event privacy", () => {
  it("removes query strings and masks identifier-like route segments", () => {
    expect(
      sanitizeOperationalRoute(
        "/admin/users/cm1234567890abcdefghijkl?token=private#secret",
      ),
    ).toBe("/admin/users/:id");
    expect(sanitizeOperationalRoute("not-a-route?token=private")).toBeNull();
  });

  it("normalizes an error class or safe code without using its message", () => {
    expect(
      normalizedOperationalErrorCode(
        Object.assign(new Error("token=must-never-appear"), { code: "P2024" }),
      ),
    ).toBe("p2024");
    expect(
      normalizedOperationalErrorCode(new TypeError("private transcript")),
    ).toBe("typeerror");
  });
});
