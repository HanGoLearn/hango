import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { getStorageProvider } from "@/lib/storage";
import { contentAudioKey } from "@/lib/audio-content-key";

// Same reasoning as handwritten-writing-evaluator.test.ts: this route reads
// serverEnv.OPENAI_API_KEY directly (not through a provider abstraction), so
// it's stubbed to a fake value here rather than depending on whatever the
// local/CI environment happens to have configured. Unlike that unit test,
// this one is an integration test that also needs a real database (via
// checkDailyUsageCap/recordAiUsage - 2026-09-05) - replacing serverEnv
// wholesale previously dropped DATABASE_URL and broke @/lib/db's connection
// for this file with ECONNREFUSED, so every other real field is preserved.
vi.mock("@/lib/env/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env/server")>();
  return {
    ...actual,
    serverEnv: { ...actual.serverEnv, OPENAI_API_KEY: "test-key" },
  };
});

const { completeMock } = vi.hoisted(() => ({ completeMock: vi.fn() }));
vi.mock("@/lib/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai")>();
  return {
    ...actual,
    getAiProvider: () => ({ name: "test-mock", complete: completeMock }),
  };
});

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { POST } = await import("../../app/api/han/speech/route");

const storage = getStorageProvider();
const usedKeys: string[] = [];
const testEmails: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  completeMock.mockReset();
  if (usedKeys.length > 0) {
    await Promise.all(usedKeys.map((key) => storage.delete(key)));
    usedKeys.length = 0;
  }
  if (testEmails.length > 0) {
    // Cascades to AiUsageLog (onDelete: Cascade) - recordAiUsage now writes
    // real rows here (2026-09-05), unlike when this test file was written.
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

/** A real User row, not just a mocked session - recordAiUsage's AiUsageLog write has a real FK on userId. */
async function authenticate(email: string): Promise<string> {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  authMock.mockResolvedValue({ user: { id: user.id } });
  return user.id;
}

function trackedCacheKey(
  text: string,
  voice = "cedar",
  responseLanguage = "English",
  conversational = false,
): string {
  const key = contentAudioKey(
    `han-speech/${voice}/${responseLanguage}/${conversational ? "conversational" : "plain"}`,
    text,
  );
  usedKeys.push(key);
  return key;
}

/** Minimal but valid 16-bit PCM mono WAV - mergeWavAudio needs real headers. */
function buildTestWav(): Buffer {
  const dataLength = 100;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(16000, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataLength, 40);
  buffer.fill(50, 44); // non-silent so trimWavSilence keeps it
  return buffer;
}

function mockTtsFetch(): ReturnType<typeof vi.fn> {
  // A fresh Response per call - a Response body can only be read once, and
  // this route is exercised with many sequential POST calls in these tests.
  const fetchMock = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(new Response(new Uint8Array(buildTestWav()), { status: 200 })),
    );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function speechRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/han/speech", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Han speech route (2026-09-05, cost audit fix - content cache + rate limit)", () => {
  it("requires authentication", async () => {
    authMock.mockResolvedValue(null);
    const fetchMock = mockTtsFetch();

    const response = await POST(speechRequest({ text: "Hello" }));

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid request without calling the AI or TTS provider", async () => {
    await authenticate(`han-speech-invalid-${Date.now()}@hango.dev`);
    const fetchMock = mockTtsFetch();

    const response = await POST(speechRequest({ text: "", voice: "cedar" }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(completeMock).not.toHaveBeenCalled();
  });

  it("generates audio once, then serves the cached clip without calling the AI or TTS provider again", async () => {
    await authenticate(`han-speech-cache-${Date.now()}@hango.dev`);
    const text = `Hello there, this is a cached test ${Date.now()}`;
    trackedCacheKey(text);
    completeMock.mockResolvedValue({
      content: text,
      provider: "test-mock",
      model: "test-model",
      inputTokens: 10,
      outputTokens: 10,
    });
    const fetchMock = mockTtsFetch();

    const first = await POST(
      speechRequest({ text, voice: "cedar", responseLanguage: "English" }),
    );
    expect(first.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(completeMock).toHaveBeenCalledTimes(1);
    const firstAudio = Buffer.from(await first.arrayBuffer());

    const second = await POST(
      speechRequest({ text, voice: "cedar", responseLanguage: "English" }),
    );
    expect(second.status).toBe(200);
    // Cache hit - no second AI rewrite call and no second TTS call.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(completeMock).toHaveBeenCalledTimes(1);
    const secondAudio = Buffer.from(await second.arrayBuffer());
    expect(secondAudio.equals(firstAudio)).toBe(true);
  });

  it(
    "rate-limits generation after 30 requests in the window",
    async () => {
      await authenticate(`han-speech-ratelimit-${Date.now()}@hango.dev`);
      completeMock.mockResolvedValue({
        content: "ok",
        provider: "test-mock",
        model: "test-model",
        inputTokens: 10,
        outputTokens: 10,
      });
      const fetchMock = mockTtsFetch();

      for (let i = 0; i < 30; i++) {
        const text = `Rate limit filler phrase number ${i} ${Date.now()}`;
        trackedCacheKey(text);
        const response = await POST(speechRequest({ text }));
        expect(response.status).toBe(200);
      }
      expect(fetchMock).toHaveBeenCalledTimes(30);

      const oneTooMany = `One too many phrase ${Date.now()}`;
      trackedCacheKey(oneTooMany);
      const response = await POST(speechRequest({ text: oneTooMany }));

      expect(response.status).toBe(429);
      // The 31st request never reached the TTS provider.
      expect(fetchMock).toHaveBeenCalledTimes(30);
    },
    // 30 iterations x 2 real DB round trips each (checkDailyUsageCap +
    // recordAiUsage, added 2026-09-05) exceeds the default 15s budget under
    // real Prisma Postgres network latency - same reasoning as this
    // project's global timeout bump (vitest.config.mts), scoped locally
    // instead of raising it for every test.
    30_000,
  );
});
