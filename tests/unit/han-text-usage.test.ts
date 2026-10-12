import { describe, expect, it } from "vitest";
import { resolveHanTextUsageFeature } from "@/lib/ai-feature-catalog";
describe("Han text accounting boundary", () => {
  it("does not let a stale surface tag mix Tutor with Companion", () => {
    expect(
      resolveHanTextUsageFeature("TUTOR", {
        hanConversationSurface: "COMPANION",
      }),
    ).toBe("han-tutor-chat");
    expect(
      resolveHanTextUsageFeature("PRACTICE", {
        hanConversationSurface: "TUTOR",
      }),
    ).toBe("han-companion-chat");
  });
  it("never attributes role-play text to Companion", () => {
    expect(
      resolveHanTextUsageFeature("PRACTICE", {
        rolePlay: {
          aiRole: "Friend",
          learnerRole: "You",
          scenarioContext: "Meet",
          objective: "Introduce yourself",
        },
      }),
    ).toBe("roleplay-chat");
  });
});
