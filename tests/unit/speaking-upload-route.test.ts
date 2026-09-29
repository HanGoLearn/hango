import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  authorize: vi.fn(),
  handleUpload: vi.fn(),
  serverEnv: {
    HANGO_STORAGE_PROVIDER: "vercel-blob" as
      "vercel-blob" | "local" | undefined,
    BLOB_READ_WRITE_TOKEN: "blob-secret" as string | undefined,
    NODE_ENV: "production" as "production" | "development" | "test",
  },
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/env/server", () => ({ serverEnv: mocks.serverEnv }));
vi.mock("@vercel/blob/client", () => ({ handleUpload: mocks.handleUpload }));
vi.mock("@/lib/speaking-upload", () => ({
  authorizeSpeakingUploadToken: mocks.authorize,
  MAX_SPEAKING_AUDIO_BYTES: 15 * 1024 * 1024,
  SPEAKING_UPLOAD_CONTENT_TYPES: ["audio/webm", "audio/ogg"],
  SPEAKING_UPLOAD_TOKEN_TTL_MS: 10 * 60 * 1000,
}));

const { POST } = await import("../../app/api/speaking/upload/route");

function tokenRequest(
  body: unknown = {
    type: "blob.generate-client-token",
    payload: {
      pathname: "speaking/user-1/session-1-id-1790000000000.webm",
      multipart: false,
      clientPayload: JSON.stringify({ sessionId: "session-1" }),
    },
  },
) {
  return new Request("http://localhost/api/speaking/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.serverEnv.HANGO_STORAGE_PROVIDER = "vercel-blob";
  mocks.serverEnv.BLOB_READ_WRITE_TOKEN = "blob-secret";
  mocks.serverEnv.NODE_ENV = "production";
});

describe("POST /api/speaking/upload", () => {
  it("rejects requests that do not come from the HanGo origin", async () => {
    const request = tokenRequest();
    request.headers.set("Origin", "https://attacker.example");

    await expect(POST(request)).resolves.toMatchObject({ status: 403 });
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.handleUpload).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated and unconfigured requests", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(POST(tokenRequest())).resolves.toMatchObject({ status: 401 });

    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.serverEnv.BLOB_READ_WRITE_TOKEN = undefined;
    await expect(POST(tokenRequest())).resolves.toMatchObject({ status: 503 });
    expect(mocks.handleUpload).not.toHaveBeenCalled();
  });

  it("issues only a short, private-size-constrained token for an owned session", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    let tokenOptions: Record<string, unknown> | undefined;
    mocks.handleUpload.mockImplementation(async (options) => {
      tokenOptions = await options.onBeforeGenerateToken(
        "speaking/user-1/session-1-id-1790000000000.webm",
        JSON.stringify({ sessionId: "session-1" }),
        false,
      );
      return { type: "blob.generate-client-token", clientToken: "short-token" };
    });

    const before = Date.now();
    const response = await POST(tokenRequest());
    const after = Date.now();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      type: "blob.generate-client-token",
      clientToken: "short-token",
    });
    expect(mocks.authorize).toHaveBeenCalledWith({
      userId: "user-1",
      sessionId: "session-1",
      pathname: "speaking/user-1/session-1-id-1790000000000.webm",
    });
    expect(tokenOptions).toMatchObject({
      allowedContentTypes: ["audio/webm", "audio/ogg"],
      maximumSizeInBytes: 15 * 1024 * 1024,
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 60,
    });
    expect(tokenOptions?.validUntil).toEqual(expect.any(Number));
    expect(tokenOptions!.validUntil as number).toBeGreaterThanOrEqual(
      before + 10 * 60 * 1000,
    );
    expect(tokenOptions!.validUntil as number).toBeLessThanOrEqual(
      after + 10 * 60 * 1000,
    );
  });

  it("does not issue a token when ownership validation fails", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-2" } });
    mocks.authorize.mockRejectedValue(new Error("Not authorized"));
    mocks.handleUpload.mockImplementation(async (options) => {
      await options.onBeforeGenerateToken(
        "speaking/user-1/session-1-id-1790000000000.webm",
        JSON.stringify({ sessionId: "session-1" }),
        false,
      );
    });

    const response = await POST(tokenRequest());
    expect(response.status).toBe(400);
  });

  it("rejects unexpected callback/event bodies", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    const response = await POST(
      tokenRequest({ type: "blob.upload-completed", payload: {} }),
    );
    expect(response.status).toBe(400);
    expect(mocks.handleUpload).not.toHaveBeenCalled();
  });
});
