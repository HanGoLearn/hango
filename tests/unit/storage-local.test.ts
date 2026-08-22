import { describe, expect, it } from "vitest";
import { resolveSafePath, STORAGE_ROOT } from "@/lib/storage/providers/local";

describe("resolveSafePath", () => {
  it("resolves a normal key under the storage root", () => {
    const path = resolveSafePath("speaking/user1/attempt1.webm");
    expect(path.startsWith(STORAGE_ROOT)).toBe(true);
  });

  it("rejects a path-traversal key", () => {
    expect(() => resolveSafePath("../../etc/passwd")).toThrow(
      "Unsafe storage key",
    );
  });

  it("rejects an empty key", () => {
    expect(() => resolveSafePath("")).toThrow("Unsafe storage key");
  });

  it("rejects a key that traverses out and back to an unrelated absolute path", () => {
    expect(() => resolveSafePath("../outside.txt")).toThrow(
      "Unsafe storage key",
    );
  });
});
