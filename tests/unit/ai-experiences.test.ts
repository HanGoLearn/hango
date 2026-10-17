import { describe, expect, it } from "vitest";
import { AI_USAGE_FEATURES } from "@/lib/ai-feature-catalog";
import {
  AI_EXPERIENCE_IDS,
  AI_FEATURE_EXPERIENCES,
  experienceLimitKey,
  normalizeAiLimitKey,
  recordedAiExperience,
  resolveAiExperience,
  speakingExperience,
} from "@/lib/ai-experiences";

describe("one source of truth for AI experience budgets", () => {
  it("covers every live operation and keeps mixed history unassigned", () => {
    expect(Object.keys(AI_FEATURE_EXPERIENCES).sort()).toEqual(
      [...AI_USAGE_FEATURES].sort(),
    );
    expect(AI_EXPERIENCE_IDS).toHaveLength(10);
    for (const feature of AI_USAGE_FEATURES) {
      const owners = AI_FEATURE_EXPERIENCES[feature];
      if (feature === "ai-teacher-chat" || feature === "han-realtime-session")
        expect(owners).toEqual([]);
      else expect(owners.length).toBeGreaterThan(0);
      for (const owner of owners) {
        expect(resolveAiExperience(feature, owner)).toBe(owner);
        expect(normalizeAiLimitKey(experienceLimitKey(owner))).toBe(
          experienceLimitKey(owner),
        );
      }
    }
  });
  it("requires an explicit source for shared speech, recognition and Speaking calls", () => {
    for (const feature of [
      "han-speech",
      "han-teacher-transcribe",
      "roleplay-chat",
      "han-realtime-assessment",
    ] as const) {
      expect(() => resolveAiExperience(feature)).toThrow();
      expect(recordedAiExperience(feature)).toBeNull();
      expect(normalizeAiLimitKey(feature)).toBeNull();
    }
    expect(resolveAiExperience("han-speech", "LESSON_REFLECTION")).toBe(
      "LESSON_REFLECTION",
    );
    expect(() =>
      resolveAiExperience("han-tutor-chat", "HAN_COMPANION"),
    ).toThrow();
    expect(
      recordedAiExperience("han-realtime-session", "HAN_TUTOR"),
    ).toBeNull();
    expect(recordedAiExperience("han-speech", "MISSPELLING")).toBeNull();
  });
  it("uses product limits for both text and voice without merging conversations", () => {
    expect(normalizeAiLimitKey("han-tutor-chat")).toBe("experience:HAN_TUTOR");
    expect(normalizeAiLimitKey("han-tutor-realtime-session")).toBe(
      "experience:HAN_TUTOR",
    );
    expect(normalizeAiLimitKey("han-companion-chat")).toBe(
      "experience:HAN_COMPANION",
    );
    expect(speakingExperience("JOURNEY")).toBe("JOURNEY_SPEAKING");
    expect(speakingExperience("SPEAKING_LAB")).toBe("SPEAKING_LAB");
    expect(speakingExperience("PLACEMENT")).toBe("PLACEMENT");
    expect(() => speakingExperience("untrusted")).toThrow();
  });
});
