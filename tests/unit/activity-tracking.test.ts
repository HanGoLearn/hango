import { describe, expect, it } from "vitest";
import {
  isLearnerActivitySurface,
  resolveActivitySurface,
} from "@/lib/activity-surface";
import { parseActivityHeartbeat } from "@/lib/activity-heartbeat";

describe("learner activity tracking", () => {
  it("keeps route-owned learning systems separate", () => {
    expect(resolveActivitySurface("/han")).toBe("GENERAL");
    expect(resolveActivitySurface("/speaking-lab/session/1")).toBe(
      "SPEAKING_LAB",
    );
    expect(resolveActivitySurface("/lesson/introductions")).toBe(
      "LEARNING_JOURNEY",
    );
    expect(resolveActivitySurface("/placement-exam")).toBe("PLACEMENT");
    expect(resolveActivitySurface("/dashboard")).toBe("GENERAL");
    expect(resolveActivitySurface("/es/speaking-lab/session/1")).toBe(
      "SPEAKING_LAB",
    );
    expect(resolveActivitySurface("/en/lesson/introductions")).toBe(
      "LEARNING_JOURNEY",
    );
    expect(isLearnerActivitySurface("HAN_TUTOR")).toBe(true);
    expect(isLearnerActivitySurface("SPEAKING")).toBe(false);
  });

  it("accepts bounded monotonic heartbeat totals", () => {
    const payload = parseActivityHeartbeat({
      clientSessionId: "session_1234567890",
      surface: "HAN_TUTOR",
      path: "/dashboard",
      startedAt: new Date().toISOString(),
      activeSeconds: 15,
      interactionCount: 2,
      sequence: 1,
    });

    expect(payload).toMatchObject({
      clientSessionId: "session_1234567890",
      surface: "HAN_TUTOR",
      activeSeconds: 15,
      interactionCount: 2,
      sequence: 1,
    });
    expect(payload?.startedAt).toBeInstanceOf(Date);
  });

  it("rejects invalid surfaces, paths, totals and stale session starts", () => {
    const valid = {
      clientSessionId: "session_1234567890",
      surface: "GENERAL",
      path: "/dashboard",
      startedAt: new Date().toISOString(),
      activeSeconds: 15,
      interactionCount: 1,
      sequence: 1,
    };

    expect(parseActivityHeartbeat({ ...valid, surface: "HAN" })).toBeNull();
    expect(parseActivityHeartbeat({ ...valid, path: "dashboard" })).toBeNull();
    expect(parseActivityHeartbeat({ ...valid, activeSeconds: -1 })).toBeNull();
    expect(parseActivityHeartbeat({ ...valid, sequence: 0 })).toBeNull();
    expect(
      parseActivityHeartbeat({ ...valid, activeSeconds: 10_000 }),
    ).toBeNull();
    expect(parseActivityHeartbeat({ ...valid, sequence: 10_000 })).toBeNull();
    expect(
      parseActivityHeartbeat({
        ...valid,
        startedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      }),
    ).toBeNull();
  });
});
