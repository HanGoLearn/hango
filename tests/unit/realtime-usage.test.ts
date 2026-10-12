import { describe, expect, it } from "vitest";
import {
  REALTIME_SESSION_ESTIMATE_USD,
  REALTIME_USAGE_FEATURES,
  resolveRealtimeUsageFeature,
} from "@/lib/realtime-usage";
import {
  AI_FAMILY_AUTHORIZATION_USD,
  AI_FEATURE_FAMILY,
  AI_USAGE_LIMIT_FEATURES,
} from "@/lib/ai-usage";
import type { AiTeacherContext } from "@/lib/ai-context";

const rolePlay = {
  aiRole: "Friend",
  learnerRole: "Learner",
  scenarioContext: "Meet a friend",
  objective: "Introduce yourself",
};

describe("separate Realtime accounting", () => {
  it("keeps the session record and global allowance at the same approved estimate", () => {
    expect(REALTIME_SESSION_ESTIMATE_USD).toBe(0.05);
    expect(AI_FAMILY_AUTHORIZATION_USD.REALTIME).toBe(0.05);
    for (const feature of REALTIME_USAGE_FEATURES) {
      expect(AI_FEATURE_FAMILY[feature]).toBe("REALTIME");
      expect(AI_USAGE_LIMIT_FEATURES).toContain(feature);
    }
    expect(AI_USAGE_LIMIT_FEATURES).not.toContain("han-realtime-session");
  });
  it("separates the bubble from Companion even if a stale context claims another surface", () => {
    expect(resolveRealtimeUsageFeature("TUTOR", {})).toBe(
      "han-tutor-realtime-session",
    );
    expect(resolveRealtimeUsageFeature("PRACTICE", {})).toBe(
      "han-companion-realtime-session",
    );
    expect(
      resolveRealtimeUsageFeature("TUTOR", {
        hanConversationSurface: "COMPANION",
      }),
    ).toBe("han-tutor-realtime-session");
  });
  it.each([
    ["JOURNEY", "journey-speaking-realtime-session"],
    ["SPEAKING_LAB", "speaking-lab-realtime-session"],
    ["PLACEMENT", "placement-realtime-session"],
  ])("separates the %s role-play surface", (surface, feature) => {
    expect(resolveRealtimeUsageFeature("PRACTICE", { rolePlay }, surface)).toBe(
      feature,
    );
  });
  it("rejects invalid tags and inconsistent Tutor/role-play combinations", () => {
    expect(resolveRealtimeUsageFeature("TUTOR", {}, "SPEAKING_LAB")).toBeNull();
    expect(
      resolveRealtimeUsageFeature("TUTOR", { rolePlay }, "JOURNEY"),
    ).toBeNull();
    expect(
      resolveRealtimeUsageFeature("PRACTICE", { rolePlay }, "wrong"),
    ).toBeNull();
  });
  it("classifies older untagged clients without writing to the shared historical bucket", () => {
    expect(resolveRealtimeUsageFeature("PRACTICE", { rolePlay })).toBe(
      "journey-speaking-realtime-session",
    );
    expect(
      resolveRealtimeUsageFeature("PRACTICE", {
        rolePlay: { ...rolePlay, isFreeTopic: true },
      } as AiTeacherContext),
    ).toBe("speaking-lab-realtime-session");
  });
});
