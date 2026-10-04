import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(),
    user: {
      updateMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { provisionAdministratorUser } from "@/lib/admin-provisioning";

const transaction = vi.mocked(db.$transaction);
const updateManyUsers = vi.mocked(db.user.updateMany);
const updateUser = vi.mocked(db.user.update);

beforeEach(() => {
  vi.clearAllMocks();
  updateManyUsers.mockResolvedValue({ count: 0 });
  updateUser.mockResolvedValue({ id: "admin-1" } as never);
  transaction.mockResolvedValue([] as never);
});

describe("provisionAdministratorUser", () => {
  it("does nothing for a regular beta user", async () => {
    const result = await provisionAdministratorUser({
      userId: "learner-1",
      email: "learner@example.com",
    });

    expect(result).toBe(false);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("makes the configured identity the only administrator", async () => {
    const result = await provisionAdministratorUser({
      userId: "admin-1",
      email: " HANGO.LEARN@GMAIL.COM ",
    });

    expect(result).toBe(true);
    expect(updateManyUsers).toHaveBeenCalledWith({
      where: { role: "ADMINISTRATOR", id: { not: "admin-1" } },
      data: { role: "LEARNER", sessionVersion: { increment: 1 } },
    });
    expect(updateUser).toHaveBeenCalledWith({
      where: { id: "admin-1" },
      data: { role: "ADMINISTRATOR", sessionVersion: { increment: 1 } },
    });
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
