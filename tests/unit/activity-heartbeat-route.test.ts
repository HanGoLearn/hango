import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, updateManyMock, createMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  updateManyMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db", () => ({
  db: {
    learnerActivitySession: {
      updateMany: updateManyMock,
      create: createMock,
    },
  },
}));

import { POST } from "../../app/api/activity/heartbeat/route";

function request(body: unknown) {
  return new Request("http://localhost/api/activity/heartbeat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validPayload = () => ({
  clientSessionId: "session_1234567890",
  surface: "SPEAKING_LAB",
  path: "/speaking-lab",
  startedAt: new Date().toISOString(),
  activeSeconds: 15,
  interactionCount: 3,
  sequence: 1,
});

describe("POST /api/activity/heartbeat", () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: "learner-1" } });
    updateManyMock.mockResolvedValue({ count: 1 });
    createMock.mockReset();
  });

  it("requires authentication", async () => {
    authMock.mockResolvedValue(null);
    const response = await POST(request(validPayload()));
    expect(response.status).toBe(401);
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("rejects malformed or implausible totals", async () => {
    const response = await POST(
      request({ ...validPayload(), activeSeconds: 80_000 }),
    );
    expect(response.status).toBe(400);
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("writes monotonic cumulative totals for the signed-in learner", async () => {
    const response = await POST(request(validPayload()));

    expect(response.status).toBe(204);
    expect(updateManyMock).toHaveBeenCalledWith({
      where: {
        userId: "learner-1",
        clientSessionId: "session_1234567890",
        surface: "SPEAKING_LAB",
        lastSequence: { lt: 1 },
      },
      data: expect.objectContaining({
        path: "/speaking-lab",
        activeSeconds: 15,
        interactionCount: 3,
        lastSequence: 1,
      }),
    });
    expect(createMock).not.toHaveBeenCalled();
  });
});
