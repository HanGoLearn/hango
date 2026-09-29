import { BlobNotFoundError } from "@vercel/blob";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VercelBlobStorageProvider } from "@/lib/storage/providers/vercel-blob";

const blobMocks = vi.hoisted(() => ({
  del: vi.fn(),
  get: vi.fn(),
  head: vi.fn(),
  list: vi.fn(),
  put: vi.fn(),
}));

vi.mock("@vercel/blob", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@vercel/blob")>();
  return { ...actual, ...blobMocks };
});

const provider = new VercelBlobStorageProvider("test-token");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("VercelBlobStorageProvider", () => {
  it("stores objects privately under the exact internal key", async () => {
    blobMocks.put.mockResolvedValue({
      pathname: "speaking/user-1/attempt.webm",
    });

    await expect(
      provider.upload(
        "speaking/user-1/attempt.webm",
        Buffer.from("audio"),
        "audio/webm",
      ),
    ).resolves.toBe("speaking/user-1/attempt.webm");

    expect(blobMocks.put).toHaveBeenCalledWith(
      "speaking/user-1/attempt.webm",
      expect.any(Buffer),
      expect.objectContaining({
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "audio/webm",
        token: "test-token",
      }),
    );
  });

  it("downloads private objects without exposing their vendor URL", async () => {
    const bytes = new TextEncoder().encode("private audio");
    blobMocks.get.mockResolvedValue({
      statusCode: 200,
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        },
      }),
    });

    await expect(
      provider.download("speaking/user-1/attempt.webm"),
    ).resolves.toEqual(Buffer.from(bytes));
    await expect(provider.getUrl("speaking/user 1/attempt.webm")).resolves.toBe(
      "/api/audio/speaking/user%201/attempt.webm",
    );
  });

  it("paginates maintenance listings and returns stable sorted keys", async () => {
    blobMocks.list
      .mockResolvedValueOnce({
        blobs: [{ pathname: "speaking/user-1/b.webm" }],
        hasMore: true,
        cursor: "next-page",
      })
      .mockResolvedValueOnce({
        blobs: [{ pathname: "speaking/user-1/a.webm" }],
        hasMore: false,
      });

    await expect(provider.list("speaking/user-1/")).resolves.toEqual([
      "speaking/user-1/a.webm",
      "speaking/user-1/b.webm",
    ]);
    expect(blobMocks.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: "next-page", token: "test-token" }),
    );
  });

  it("distinguishes a missing object from a provider failure", async () => {
    blobMocks.head.mockRejectedValueOnce(new BlobNotFoundError());
    await expect(provider.exists("speaking/user-1/missing.webm")).resolves.toBe(
      false,
    );

    blobMocks.head.mockRejectedValueOnce(new Error("provider unavailable"));
    await expect(provider.exists("speaking/user-1/error.webm")).rejects.toThrow(
      "provider unavailable",
    );
  });

  it("rejects unsafe keys before calling the vendor", async () => {
    await expect(
      provider.delete("speaking/user-1/../../shared.webm"),
    ).rejects.toThrow("Unsafe storage key");
    expect(blobMocks.del).not.toHaveBeenCalled();
  });
});
