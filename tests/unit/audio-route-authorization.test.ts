import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  speakingAttemptFindFirst: vi.fn(),
  download: vi.fn(),
  getNextQuestion: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: {
    speakingAttempt: { findFirst: mocks.speakingAttemptFindFirst },
    dialogueLine: { findFirst: vi.fn() },
    dialogue: { findFirst: vi.fn() },
    vocabularyItem: { findFirst: vi.fn() },
    vocabularyExample: { findFirst: vi.fn() },
    grammarExample: { findFirst: vi.fn() },
    placementListeningLine: { findFirst: vi.fn() },
    placementListeningScript: { findFirst: vi.fn() },
    placementSession: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/placement-exam-data", () => ({
  getNextQuestion: mocks.getNextQuestion,
}));
vi.mock("@/lib/storage", () => ({
  getStorageProvider: () => ({ download: mocks.download }),
}));

const { GET } = await import("../../app/api/audio/[...key]/route");

function requestFor(key: string) {
  return new NextRequest(`http://localhost/api/audio/${key}`);
}

function paramsFor(key: string) {
  return { params: Promise.resolve({ key: key.split("/") }) };
}

describe("private audio route authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "owner" } });
  });

  it("returns 401 before looking up or downloading an object", async () => {
    mocks.auth.mockResolvedValue(null);
    const key = "speaking/owner/session-1.m4a";

    const response = await GET(requestFor(key), paramsFor(key));

    expect(response.status).toBe(401);
    expect(mocks.speakingAttemptFindFirst).not.toHaveBeenCalled();
    expect(mocks.download).not.toHaveBeenCalled();
  });

  it("hides another learner's object and never asks storage for its bytes", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "attacker" } });
    mocks.speakingAttemptFindFirst.mockResolvedValue({
      session: { userId: "victim" },
    });
    const key = "speaking/victim/session-1.m4a";

    const response = await GET(requestFor(key), paramsFor(key));

    expect(response.status).toBe(404);
    expect(mocks.speakingAttemptFindFirst).toHaveBeenCalledWith({
      where: { audioFilePath: key },
      include: { session: { select: { userId: true } } },
    });
    expect(mocks.download).not.toHaveBeenCalled();
  });

  it("serves an owned M4A object through the storage provider", async () => {
    mocks.speakingAttemptFindFirst.mockResolvedValue({
      session: { userId: "owner" },
    });
    mocks.download.mockResolvedValue(Buffer.from([1, 2, 3]));
    const key = "speaking/owner/session-1.m4a";

    const response = await GET(requestFor(key), paramsFor(key));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/mp4");
    expect(response.headers.get("cache-control")).toBe(
      "private, max-age=0, no-store",
    );
    expect(Buffer.from(await response.arrayBuffer())).toEqual(
      Buffer.from([1, 2, 3]),
    );
    expect(mocks.download).toHaveBeenCalledWith(key);
  });
});
