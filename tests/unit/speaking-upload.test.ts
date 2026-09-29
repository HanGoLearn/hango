import { describe, expect, it } from "vitest";
import { parsePrivateSpeakingObjectKey } from "@/lib/private-object-retention";
import {
  assertOwnedSpeakingUploadKey,
  buildSpeakingUploadKey,
  normalizeSpeakingUploadMimeType,
} from "@/lib/speaking-upload";

describe("Speaking Lab direct-upload keys", () => {
  it("creates a private owner/session key that the retention scanner can date", () => {
    const now = 1_790_000_000_000;
    const key = buildSpeakingUploadKey(
      "user-1",
      "session-1",
      "audio/webm;codecs=opus",
      now,
    );

    expect(key).toMatch(
      /^speaking\/user-1\/session-1-[0-9a-f-]+-1790000000000\.webm$/,
    );
    expect(parsePrivateSpeakingObjectKey(key)).toEqual({
      ownerUserId: "user-1",
      createdAt: new Date(now),
    });
    expect(
      assertOwnedSpeakingUploadKey(key, "user-1", "session-1", "audio/webm"),
    ).toBe(key);
  });

  it("rejects a different owner, session or extension", () => {
    const key = buildSpeakingUploadKey("user-1", "session-1", "audio/ogg");
    expect(() =>
      assertOwnedSpeakingUploadKey(key, "user-2", "session-1"),
    ).toThrow("Not authorized");
    expect(() =>
      assertOwnedSpeakingUploadKey(key, "user-1", "session-2"),
    ).toThrow("Not authorized");
    expect(() =>
      assertOwnedSpeakingUploadKey(key, "user-1", "session-1", "audio/webm"),
    ).toThrow("Unsupported recording format");
  });

  it("normalizes supported browser MIME parameters and rejects non-audio", () => {
    expect(normalizeSpeakingUploadMimeType("audio/webm;codecs=opus")).toBe(
      "audio/webm",
    );
    expect(normalizeSpeakingUploadMimeType("audio/wave")).toBe("audio/wav");
    expect(() => normalizeSpeakingUploadMimeType("video/webm")).toThrow(
      "Unsupported recording format",
    );
  });
});
