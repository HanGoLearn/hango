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
    expect(body).not.toHaveProperty("response_format");
    expect(result).not.toHaveProperty("outputStatus");
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
      "minimal",
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
      reasoning_effort: "minimal",
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

  it("opts into a strict JSON schema without changing model or reasoning effort", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: "{}" }, finish_reason: "stop" }],
        usage: { prompt_tokens: 12, completion_tokens: 8 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const schema = {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    };
    const result = await new OpenAiProvider("test").complete({
      systemPrompt: "Return JSON",
      messages: [],
      structuredOutput: { name: "test_judgment", schema },
      retry: false,
    });
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toMatchObject({
      model: "gpt-5-mini",
      reasoning_effort: "minimal",
      response_format: {
        type: "json_schema",
        json_schema: { name: "test_judgment", schema, strict: true },
      },
    });
    expect(result.outputStatus).toBe("complete");
  });

  it.each([
    [{ content: null, refusal: "Cannot evaluate" }, "stop", "refused"],
    [{ content: '{"dimensions":' }, "length", "incomplete"],
    [{ content: null }, "stop", "incomplete"],
    [{ content: "{}" }, "content_filter", "incomplete"],
  ])(
    "preserves usage for an unusable structured completion (%s)",
    async (message, finish, status) => {
      const fetchMock = vi.fn().mockResolvedValue(
        jsonResponse({
          choices: [{ message, finish_reason: finish }],
          usage: { prompt_tokens: 120, completion_tokens: 30 },
        }),
      );
      vi.stubGlobal("fetch", fetchMock);
      const result = await new OpenAiProvider("test").complete({
        systemPrompt: "Return JSON",
        messages: [],
        structuredOutput: { name: "test", schema: {} },
        retry: false,
      });
      expect(result).toMatchObject({
        outputStatus: status,
        inputTokens: 120,
        outputTokens: 30,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    new TypeError("network"),
    new DOMException("timeout", "AbortError"),
    "http",
  ])(
    "does not silently retry a single-dispatch request (%s)",
    async (error) => {
      const fetchMock =
        error === "http"
          ? vi.fn().mockResolvedValue(jsonResponse({ error: "server" }, 500))
          : vi.fn().mockRejectedValue(error);
      vi.stubGlobal("fetch", fetchMock);
      await expect(
        new OpenAiProvider("test").complete({
          systemPrompt: "Return JSON",
          messages: [],
          retry: false,
        }),
      ).rejects.toBeInstanceOf(AiProviderError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );
});
