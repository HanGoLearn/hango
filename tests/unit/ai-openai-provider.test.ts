import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAiProvider } from "@/lib/ai/providers/openai";
import { AiProviderError } from "@/lib/ai/provider";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OpenAiProvider", () => {
  it("sends the system prompt and messages, and parses the reply + usage", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { role: "assistant", content: "こんにちは" } }],
        usage: { prompt_tokens: 42, completion_tokens: 7 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAiProvider("test-key", "gpt-4o-mini");
    const result = await provider.complete({
      systemPrompt: "You are a tutor.",
      messages: [{ role: "user", content: "Hi" }],
    });

    expect(result.content).toBe("こんにちは");
    expect(result.provider).toBe("openai");
    expect(result.model).toBe("gpt-4o-mini");
    expect(result.inputTokens).toBe(42);
    expect(result.outputTokens).toBe(7);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(init.headers.authorization).toBe("Bearer test-key");
    const body = JSON.parse(init.body);
    expect(body.messages[0]).toEqual({
      role: "system",
      content: "You are a tutor.",
    });
    expect(body.messages[1]).toEqual({ role: "user", content: "Hi" });
  });

  it("uses the configured beta model by default", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { role: "assistant", content: "OK" } }],
        usage: { prompt_tokens: 1, completion_tokens: 1 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAiProvider("test-key");
    const result = await provider.complete({
      systemPrompt: "You are a tutor.",
      messages: [],
    });

    expect(result.model).toBe("gpt-5-mini");
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).model).toBe(
      "gpt-5-mini",
    );
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).reasoning_effort).toBe(
      "low",
    );
  });

  it("honors a larger output budget for evaluation requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { role: "assistant", content: "{}" } }],
        usage: { prompt_tokens: 10, completion_tokens: 20 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAiProvider("test-key");
    await provider.complete({
      systemPrompt: "Return JSON.",
      messages: [],
      maxOutputTokens: 1_600,
      timeoutMs: 45_000,
    });

    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toMatchObject({
      max_completion_tokens: 1_600,
      reasoning_effort: "low",
    });
  });

  it("normalizes a 429 response to a rate_limited AiProviderError", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ error: "too many requests" }, 429)),
    );

    const provider = new OpenAiProvider("test-key");
    await expect(
      provider.complete({ systemPrompt: "x", messages: [] }),
    ).rejects.toMatchObject({
      code: "rate_limited",
    } satisfies Partial<AiProviderError>);
  });

  it("normalizes a 400 response to an invalid_request AiProviderError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "bad request" }, 400)),
    );

    const provider = new OpenAiProvider("test-key");
    await expect(
      provider.complete({ systemPrompt: "x", messages: [] }),
    ).rejects.toMatchObject({ code: "invalid_request" });
  });

  it("retries once on a 500 and gives up as unavailable", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: "boom" }, 500));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAiProvider("test-key");
    await expect(
      provider.complete({ systemPrompt: "x", messages: [] }),
    ).rejects.toMatchObject({ code: "unavailable" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("normalizes a network failure to unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    const provider = new OpenAiProvider("test-key");
    await expect(
      provider.complete({ systemPrompt: "x", messages: [] }),
    ).rejects.toMatchObject({ code: "unavailable" });
  });
});
