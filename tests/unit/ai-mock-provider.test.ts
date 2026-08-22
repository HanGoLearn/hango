import { describe, expect, it } from "vitest";
import { MockAiProvider } from "@/lib/ai/providers/mock";

describe("MockAiProvider", () => {
  it("responds without any network access, echoing the last user message", async () => {
    const provider = new MockAiProvider();
    const result = await provider.complete({
      systemPrompt: "You are a tutor.",
      messages: [
        { role: "user", content: "Can you explain this grammar point?" },
      ],
    });

    expect(result.provider).toBe("mock");
    expect(result.content).toContain("grammar");
    expect(result.inputTokens).toBeGreaterThan(0);
    expect(result.outputTokens).toBeGreaterThan(0);
  });
});
