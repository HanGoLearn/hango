import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  authorize: vi.fn(),
  handleUploadPresigned: vi.fn(),
  issueSignedToken: vi.fn(),
  serverEnv: {
    HANGO_STORAGE_PROVIDER: "vercel-blob" as
      "vercel-blob" | "local" | undefined,
    BLOB_STORE_ID: "store-1" as string | undefined,
    BLOB_READ_WRITE_TOKEN: undefined as string | undefined,
    NODE_ENV: "production" as "production" | "development" | "test",
  },
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/env/server", () => ({ serverEnv: mocks.serverEnv }));
vi.mock("@vercel/blob", () => ({ issueSignedToken: mocks.issueSignedToken }));
vi.mock("@vercel/blob/client", () => ({
  handleUploadPresigned: mocks.handleUploadPresigned,
}));
vi.mock("@/lib/speaking-upload", () => ({
  authorizeSpeakingUploadToken: mocks.authorize,
  MAX_SPEAKING_AUDIO_BYTES: 15 * 1024 * 1024,
  SPEAKING_UPLOAD_CONTENT_TYPES: ["audio/webm", "audio/ogg"],
  SPEAKING_UPLOAD_TOKEN_TTL_MS: 10 * 60 * 1000,
}));

const { POST } = await import("../../app/api/speaking/upload/route");

function presignedUrlRequest(
  body: unknown = {
    type: "blob.generate-presigned-url",
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
  mocks.serverEnv.BLOB_STORE_ID = "store-1";
  mocks.serverEnv.BLOB_READ_WRITE_TOKEN = undefined;
  mocks.serverEnv.NODE_ENV = "production";
  mocks.issueSignedToken.mockResolvedValue({
    delegationToken: "delegation-token",
    clientSigningToken: "client-signing-token",
    validUntil: Date.now() + 10 * 60 * 1000,
  });
});

describe("POST /api/speaking/upload", () => {
  it("rejects requests that do not come from the HanGo origin", async () => {
    const request = presignedUrlRequest();
    request.headers.set("Origin", "https://attacker.example");

    await expect(POST(request)).resolves.toMatchObject({ status: 403 });
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.handleUploadPresigned).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated and unconfigured requests", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(POST(presignedUrlRequest())).resolves.toMatchObject({
      status: 401,
    });

    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.serverEnv.BLOB_STORE_ID = undefined;
    mocks.serverEnv.BLOB_READ_WRITE_TOKEN = undefined;
    await expect(POST(presignedUrlRequest())).resolves.toMatchObject({
      status: 503,
    });
    expect(mocks.handleUploadPresigned).not.toHaveBeenCalled();
  });

  it("issues only a short, private-size-constrained presigned URL for an owned session", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    let signedOptions:
      | {
          token: unknown;
          urlOptions: Record<string, unknown> | undefined;
        }
      | undefined;
    mocks.handleUploadPresigned.mockImplementation(async (options) => {
      signedOptions = await options.getSignedToken(
        "speaking/user-1/session-1-id-1790000000000.webm",
        JSON.stringify({ sessionId: "session-1" }),
        false,
      );
      return {
        type: "blob.generate-presigned-url",
        presignedUrlPayload: {
          delegationToken: "delegation-token",
          signature: "signature",
          params: {},
        },
      };
    });

    const before = Date.now();
    const response = await POST(presignedUrlRequest());
    const after = Date.now();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      type: "blob.generate-presigned-url",
      presignedUrlPayload: {
        delegationToken: "delegation-token",
        signature: "signature",
        params: {},
      },
    });
    expect(mocks.authorize).toHaveBeenCalledWith({
      userId: "user-1",
      sessionId: "session-1",
      pathname: "speaking/user-1/session-1-id-1790000000000.webm",
    });
    expect(mocks.issueSignedToken).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "speaking/user-1/session-1-id-1790000000000.webm",
        operations: ["put"],
        allowedContentTypes: ["audio/webm", "audio/ogg"],
        maximumSizeInBytes: 15 * 1024 * 1024,
        storeId: "store-1",
      }),
    );
    expect(signedOptions?.urlOptions).toMatchObject({
      allowedContentTypes: ["audio/webm", "audio/ogg"],
      maximumSizeInBytes: 15 * 1024 * 1024,
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 60,
    });
    expect(signedOptions?.urlOptions?.validUntil).toEqual(expect.any(Number));
    expect(
      signedOptions!.urlOptions!.validUntil as number,
    ).toBeGreaterThanOrEqual(before + 10 * 60 * 1000);
    expect(signedOptions!.urlOptions!.validUntil as number).toBeLessThanOrEqual(
      after + 10 * 60 * 1000,
    );
  });

  it("does not issue a token when ownership validation fails", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-2" } });
    mocks.authorize.mockRejectedValue(new Error("Not authorized"));
    mocks.handleUploadPresigned.mockImplementation(async (options) => {
      await options.getSignedToken(
        "speaking/user-1/session-1-id-1790000000000.webm",
        JSON.stringify({ sessionId: "session-1" }),
        false,
      );
    });

    const response = await POST(presignedUrlRequest());
    expect(response.status).toBe(400);
  });

  it("rejects unexpected callback/event bodies", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    const response = await POST(
      presignedUrlRequest({ type: "blob.upload-completed", payload: {} }),
    );
    expect(response.status).toBe(400);
    expect(mocks.handleUploadPresigned).not.toHaveBeenCalled();
  });
});
