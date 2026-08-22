import { afterEach, describe, expect, it, vi } from "vitest";
import { MockSttProvider } from "@/lib/speech/providers/mock";
import { OpenAiSttProvider } from "@/lib/speech/providers/openai";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MockSttProvider", () => {
  it("returns a canned transcript without any network access", async () => {
    const provider = new MockSttProvider();
    const result = await provider.transcribe(
      Buffer.from("fake audio"),
      "audio/webm",
      "mandarin",
    );

    expect(result.provider).toBe("mock");
    expect(result.transcript).toContain("Mock transcription");
    expect(result.confidence).toBe(0.5);
  });
});

describe("OpenAiSttProvider", () => {
  it("sends the audio as multipart form data and parses the transcript", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          text: "你好",
          logprobs: [{ token: "你", logprob: Math.log(0.8) }],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAiSttProvider("test-key");
    const result = await provider.transcribe(
      Buffer.from("fake audio"),
      "audio/webm",
      "mandarin",
    );

    expect(result.transcript).toBe("你好");
    expect(result.provider).toBe("openai");
    expect(result.model).toBe("gpt-4o-transcribe");
    expect(result.confidence).toBeCloseTo(0.8);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.openai.com/v1/audio/transcriptions");
    expect(init.headers.authorization).toBe("Bearer test-key");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("model")).toBe("gpt-4o-transcribe");
    expect((init.body as FormData).get("language")).toBe("zh");
    expect((init.body as FormData).get("include[]")).toBe("logprobs");
    expect((init.body as FormData).get("response_format")).toBe("json");
    expect((init.body as FormData).get("prompt")).toContain("普通话");
  });

  it("biases Han's multilingual chat toward Spanish, English, and Mandarin", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ text: "Hola Han" }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await new OpenAiSttProvider("test-key").transcribe(
      Buffer.from("fake audio"),
      "audio/webm",
      "han-multilingual",
    );

    const formData = fetchMock.mock.calls[0]![1].body as FormData;
    expect(formData.has("language")).toBe(false);
    expect(formData.get("prompt")).toContain("Spanish");
    expect(formData.get("prompt")).toContain("English");
    expect(formData.get("prompt")).toContain("Mandarin Chinese");
    expect(formData.get("prompt")).toContain("ai");
    expect(formData.get("prompt")).toContain("Thai");
  });

  it("labels uploaded audio with an extension matching its MIME type", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ text: "Hola Han" }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await new OpenAiSttProvider("test-key").transcribe(
      Buffer.from("fake wav"),
      "audio/wav",
      "han-multilingual",
    );

    const formData = fetchMock.mock.calls[0]![1].body as FormData;
    expect((formData.get("file") as File).name).toBe("recording.wav");
  });

  it("normalizes a 400 response to invalid_audio", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({}), { status: 400 })),
    );

    const provider = new OpenAiSttProvider("test-key");
    await expect(
      provider.transcribe(Buffer.from("x"), "audio/webm", "mandarin"),
    ).rejects.toMatchObject({ code: "invalid_audio" });
  });
});
