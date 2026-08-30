import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { saveAvatarAnimalAction } = await import("@/lib/actions/avatar");

const testEmails: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

async function createTestUser(email: string) {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  authMock.mockResolvedValue({ user: { id: user.id } });
  return user;
}

describe("avatar animal selection (integration, real database)", () => {
  it("sets the animal on first pick", async () => {
    const user = await createTestUser(`avatar-set-${Date.now()}@hango.dev`);
    const result = await saveAvatarAnimalAction("RABBIT");
    expect(result.status).toBe("idle");

    const avatar = await db.learnerAvatar.findUnique({
      where: { userId: user.id },
    });
    expect(avatar?.animal).toBe("RABBIT");
  });

  it("is freely changeable - unlike Account Name, a later pick overwrites the earlier one", async () => {
    const user = await createTestUser(`avatar-change-${Date.now()}@hango.dev`);
    await saveAvatarAnimalAction("RABBIT");
    const result = await saveAvatarAnimalAction("MONKEY");
    expect(result.status).toBe("idle");

    const avatar = await db.learnerAvatar.findUnique({
      where: { userId: user.id },
    });
    expect(avatar?.animal).toBe("MONKEY");
  });

  it("rejects an animal that isn't available yet", async () => {
    await createTestUser(`avatar-locked-${Date.now()}@hango.dev`);
    const result = await saveAvatarAnimalAction("TIGER");
    expect(result.status).toBe("error");
  });

  it("rejects an unknown animal key", async () => {
    await createTestUser(`avatar-bogus-${Date.now()}@hango.dev`);
    const result = await saveAvatarAnimalAction("NOT_A_REAL_ANIMAL");
    expect(result.status).toBe("error");
  });
});
