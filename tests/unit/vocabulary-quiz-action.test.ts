import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), record: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/vocabulary-interactivity", () => ({
  recordVocabularyQuizAttempts: mocks.record,
  recordVocabularyWordSeen: vi.fn(),
  getOrGenerateVocabularyItemAudioUrl: vi.fn(),
  getOrGenerateVocabularyExampleAudioUrl: vi.fn(),
  getVocabularyExamples: vi.fn(),
  VocabularyInteractivityRateLimitError: class extends Error {},
  VocabularyInteractivityNotFoundError: class extends Error {},
}));
vi.mock("@/lib/tts", () => ({ TtsProviderError: class extends Error {} }));
vi.mock("@/lib/ai-usage", () => ({
  DailyUsageCapExceededError: class extends Error {},
}));
import { recordVocabularyQuizAttemptsAction } from "@/lib/actions/vocabulary-interactivity";
beforeEach(() => vi.clearAllMocks());
describe("vocabulary answer save acknowledgment", () => {
  it("lost authentication is a rejected save, not a false acknowledgment", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(
      recordVocabularyQuizAttemptsAction("lesson", []),
    ).rejects.toThrow("Not authenticated");
    expect(mocks.record).not.toHaveBeenCalled();
  });
  it("uses the authenticated owner and awaits the actual record", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner" } });
    mocks.record.mockRejectedValue(new Error("offline"));
    await expect(
      recordVocabularyQuizAttemptsAction("lesson", []),
    ).rejects.toThrow("offline");
    expect(mocks.record).toHaveBeenCalledWith("owner", "lesson", []);
  });
});
