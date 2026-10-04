import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdministrator: vi.fn(),
  announcementCreate: vi.fn(),
  userFindUnique: vi.fn(),
  ledgerFindUnique: vi.fn(),
  ledgerCreate: vi.fn(),
  grantCreate: vi.fn(),
  transaction: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdministrator: mocks.requireAdministrator,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/db", () => ({
  db: {
    announcement: { create: mocks.announcementCreate },
    user: { findUnique: mocks.userFindUnique },
    coinLedgerEntry: { findUnique: mocks.ledgerFindUnique },
    $transaction: mocks.transaction,
  },
}));

const { createAnnouncementAction, grantHanCoinsAction } =
  await import("@/lib/actions/admin-communications");

const emptyState = { ok: false, message: "" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdministrator.mockResolvedValue({
    id: "admin-1",
    email: "hango.learn@gmail.com",
    name: "HanGo Learn",
    role: "ADMINISTRATOR",
  });
  mocks.transaction.mockImplementation(async (callback) =>
    callback({
      coinLedgerEntry: { create: mocks.ledgerCreate },
      adminCoinGrant: { create: mocks.grantCreate },
    }),
  );
});

describe("admin communications actions", () => {
  it("publishes an announcement with an internal call to action", async () => {
    const form = new FormData();
    form.set("title", "Nueva práctica disponible");
    form.set("message", "Ya puedes probar una nueva situación de aprendizaje.");
    form.set("type", "UPDATE");
    form.set("priority", "NORMAL");
    form.set("publication", "PUBLISHED");
    form.set("ctaLabel", "Probar ahora");
    form.set("ctaHref", "/learn");

    const result = await createAnnouncementAction(emptyState, form);

    expect(result).toEqual({ ok: true, message: "Anuncio publicado." });
    expect(mocks.announcementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdByUserId: "admin-1",
          status: "PUBLISHED",
          ctaHref: "/learn",
        }),
      }),
    );
  });

  it("rejects an external announcement destination", async () => {
    const form = new FormData();
    form.set("title", "Aviso importante");
    form.set(
      "message",
      "Este texto tiene suficiente contexto para el anuncio.",
    );
    form.set("type", "IMPORTANT");
    form.set("priority", "IMPORTANT");
    form.set("publication", "PUBLISHED");
    form.set("ctaLabel", "Abrir");
    form.set("ctaHref", "https://example.com");

    const result = await createAnnouncementAction(emptyState, form);

    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.ctaHref).toBeDefined();
    expect(mocks.announcementCreate).not.toHaveBeenCalled();
  });

  it("creates the HanCoin ledger entry and its audit record atomically", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "learner-1",
      email: "learner@example.com",
    });
    mocks.ledgerFindUnique.mockResolvedValue(null);
    mocks.ledgerCreate.mockResolvedValue({ id: "ledger-1" });
    const form = new FormData();
    form.set("requestId", "9a9e86a2-3c06-4d34-b252-cc3e4b0a75ce");
    form.set("recipientUserId", "learner-1");
    form.set("amount", "250");
    form.set("message", "Gracias por ayudarnos a mejorar HanGo.");
    form.set("internalNote", "Prueba beta");

    const result = await grantHanCoinsAction(emptyState, form);

    expect(result.ok).toBe(true);
    expect(mocks.ledgerCreate).toHaveBeenCalledWith({
      data: {
        userId: "learner-1",
        amount: 250,
        reason: "admin_grant",
        sourceKey: "admin_grant:9a9e86a2-3c06-4d34-b252-cc3e4b0a75ce",
      },
      select: { id: true },
    });
    expect(mocks.grantCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        coinLedgerEntryId: "ledger-1",
        recipientUserId: "learner-1",
        grantedByUserId: "admin-1",
        amount: 250,
      }),
    });
  });

  it("does not grant twice when the same request is retried", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "learner-1",
      email: "learner@example.com",
    });
    mocks.ledgerFindUnique.mockResolvedValue({ id: "ledger-existing" });
    const form = new FormData();
    form.set("requestId", "9a9e86a2-3c06-4d34-b252-cc3e4b0a75ce");
    form.set("recipientUserId", "learner-1");
    form.set("amount", "250");
    form.set("message", "Gracias por ayudarnos a mejorar HanGo.");

    const result = await grantHanCoinsAction(emptyState, form);

    expect(result).toEqual({
      ok: true,
      message: "Esta entrega ya había sido procesada.",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
