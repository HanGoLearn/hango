import { describe, expect, it } from "vitest";
import { resolveSafePath, STORAGE_ROOT } from "@/lib/storage/providers/local";
import { parsePrivateSpeakingObjectKey } from "@/lib/private-object-retention";

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

describe("parsePrivateSpeakingObjectKey", () => {
  it("accepts only learner-private Speaking Lab recordings", () => {
    const parsed = parsePrivateSpeakingObjectKey(
      "speaking/user-1/session-1720000000000.webm",
    );
    expect(parsed?.ownerUserId).toBe("user-1");
    expect(parsed?.createdAt?.getTime()).toBe(1720000000000);

    expect(
      parsePrivateSpeakingObjectKey("vocabulary-audio/shared.mp3"),
    ).toBeNull();
    expect(
      parsePrivateSpeakingObjectKey("speaking/user-1/../../shared.webm"),
    ).toBeNull();
    expect(
      parsePrivateSpeakingObjectKey("speaking/user-1/not-a-recording.mp3"),
    ).toBeNull();
  });
});
