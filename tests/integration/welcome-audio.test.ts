import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { getStorageProvider } from "@/lib/storage";
import { contentAudioKey } from "@/lib/audio-content-key";

// Same reasoning as dialogue-audio.test.ts: mock @/lib/tts directly so this
// never makes a real network call regardless of whether OPENAI_API_KEY
// happens to be set locally. Storage is left real (LocalStorageProvider
// writes to the gitignored .storage/ folder) - same as every other
// content-addressed audio test, zero cost either way.
const { synthesizeMock } = vi.hoisted(() => ({ synthesizeMock: vi.fn() }));
vi.mock("@/lib/tts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tts")>();
  return {
    ...actual,
    getTtsProvider: () => ({ name: "test-mock", synthesize: synthesizeMock }),
  };
});

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const {
  getOrGenerateWelcomeAudioUrl,
  WelcomeAudioNotAllowedError,
  WelcomeAudioRateLimitError,
} = await import("@/lib/welcome-audio");
const { getWelcomeAudioAction } = await import("@/lib/actions/welcome-audio");

const storage = getStorageProvider();
const testEmails: string[] = [];
const usedKeys: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  synthesizeMock.mockReset();
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
  if (usedKeys.length > 0) {
    await Promise.all(usedKeys.map((key) => storage.delete(key)));
    usedKeys.length = 0;
  }
});

async function createTestUser(email: string) {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  authMock.mockResolvedValue({ user: { id: user.id } });
  return user;
}

/**
 * The allowlist (WELCOME_PHRASES in welcome-audio.ts) only accepts a fixed
 * set of real phrases, so tests can't key off unique random text the way
 * other content-addressed audio tests do. Clears any file left cached on
 * real local disk from a previous run (and registers it for cleanup after
 * this one) so every test starts from a genuine cache miss.
 */
async function freshPhrase(text: string): Promise<string> {
  const key = contentAudioKey("welcome-audio", text);
  usedKeys.push(key);
  await storage.delete(key);
  return text;
}

function mockSynthesis() {
  synthesizeMock.mockResolvedValue({
    audio: Buffer.from("fake mp3 bytes"),
    contentType: "audio/mpeg",
    provider: "test-mock",
    model: "test-model",
  });
}

describe("Welcome audio (2026-09-05, integration, real database + local storage, mocked TTS provider)", () => {
  it("generates audio for an allowed phrase once, then reuses the cached file on replay", async () => {
    const user = await createTestUser(
      `welcome-audio-${Date.now()}@hango.dev`,
    );
    const text = await freshPhrase("你好");
    mockSynthesis();

    const firstUrl = await getOrGenerateWelcomeAudioUrl(user.id, text);
    expect(firstUrl).toBeTruthy();
    expect(synthesizeMock).toHaveBeenCalledTimes(1);
    expect(synthesizeMock).toHaveBeenCalledWith(text, "alloy");

    const secondUrl = await getOrGenerateWelcomeAudioUrl(user.id, text);
    expect(secondUrl).toBe(firstUrl);
    expect(synthesizeMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a phrase that isn't on the allowlist, without calling the TTS provider", async () => {
    const user = await createTestUser(
      `welcome-audio-notallowed-${Date.now()}@hango.dev`,
    );

    await expect(
      getOrGenerateWelcomeAudioUrl(user.id, "this is not on the allowlist"),
    ).rejects.toBeInstanceOf(WelcomeAudioNotAllowedError);
    expect(synthesizeMock).not.toHaveBeenCalled();
  });

  it("rate-limits generation after 30 requests in the window", async () => {
    const user = await createTestUser(
      `welcome-audio-ratelimit-${Date.now()}@hango.dev`,
    );
    mockSynthesis();

    // 30 distinct allowlisted phrases, none reused by the other tests in
    // this file - the allowlist has exactly 33 entries total.
    const phrases = [
      "再见", "谢谢", "不客气", "对不起", "没关系", "妈", "麻", "马", "骂", "我",
      "你", "他", "她", "我们", "你们", "他们", "她们", "一", "二", "三",
      "四", "五", "六", "七", "八", "九", "十", "十一", "二十", "二十一",
    ];
    for (const phrase of phrases) {
      const text = await freshPhrase(phrase);
      await getOrGenerateWelcomeAudioUrl(user.id, text);
    }

    const oneTooMany = await freshPhrase("我是学生");
    await expect(
      getOrGenerateWelcomeAudioUrl(user.id, oneTooMany),
    ).rejects.toBeInstanceOf(WelcomeAudioRateLimitError);
  });

  it("the server action rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await getWelcomeAudioAction("你好");
    expect(result.ok).toBe(false);
    expect(synthesizeMock).not.toHaveBeenCalled();
  });

  it("the server action plays an allowed phrase for an authenticated user", async () => {
    const user = await createTestUser(
      `welcome-audio-action-${Date.now()}@hango.dev`,
    );
    void user;
    const text = await freshPhrase("我十八岁");
    mockSynthesis();

    const result = await getWelcomeAudioAction(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url).toBeTruthy();
    }
  });
});
