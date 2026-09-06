import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { grantAdminCoins } from "@/lib/admin-communications";
import {
  acknowledgeAnnouncementForUser,
  getPendingAnnouncementsForUser,
} from "@/lib/learner-notices";

const testUserIds: string[] = [];
const testAnnouncementIds: string[] = [];

afterEach(async () => {
  if (testAnnouncementIds.length) {
    await db.announcement.deleteMany({
      where: { id: { in: testAnnouncementIds.splice(0) } },
    });
  }
  if (testUserIds.length) {
    await db.user.deleteMany({ where: { id: { in: testUserIds.splice(0) } } });
  }
});

async function createUser(prefix: string) {
  const user = await db.user.create({
    data: { email: `${prefix}-${randomUUID()}@hango.dev` },
  });
  testUserIds.push(user.id);
  return user;
}

describe("admin back-office (integration, real database)", () => {
  it("delivers only active published announcements and remembers acknowledgement", async () => {
    const [administrator, learner] = await Promise.all([
      createUser("admin-notice"),
      createUser("learner-notice"),
    ]);
    const now = Date.now();
    const active = await db.announcement.create({
      data: {
        title: "Nueva práctica",
        message: "Ya puedes practicar una situación nueva en HanGo.",
        status: "PUBLISHED",
        startsAt: new Date(now - 60_000),
        endsAt: new Date(now + 60_000),
        createdByUserId: administrator.id,
      },
    });
    const draft = await db.announcement.create({
      data: {
        title: "Borrador",
        message: "Este anuncio todavía no debe mostrarse al estudiante.",
        status: "DRAFT",
        startsAt: new Date(now - 60_000),
        createdByUserId: administrator.id,
      },
    });
    testAnnouncementIds.push(active.id, draft.id);

    const firstVisit = await getPendingAnnouncementsForUser(learner.id);
    expect(firstVisit.map((announcement) => announcement.id)).toEqual([
      active.id,
    ]);
    expect(
      await db.announcementReceipt.findUnique({
        where: {
          announcementId_userId: {
            announcementId: active.id,
            userId: learner.id,
          },
        },
      }),
    ).toMatchObject({ acknowledgedAt: null });

    await acknowledgeAnnouncementForUser(learner.id, active.id);
    expect(await getPendingAnnouncementsForUser(learner.id)).toEqual([]);
  });

  it("grants HanCoins atomically and is idempotent for a retried request", async () => {
    const [administrator, learner] = await Promise.all([
      createUser("admin-coins"),
      createUser("learner-coins"),
    ]);
    const requestId = randomUUID();
    const input = {
      recipientUserId: learner.id,
      grantedByUserId: administrator.id,
      requestId,
      amount: 175,
      message: "Gracias por probar la nueva experiencia.",
      internalNote: "Prueba de integración",
    };

    await expect(grantAdminCoins(input)).resolves.toEqual({
      alreadyProcessed: false,
    });
    await expect(grantAdminCoins(input)).resolves.toEqual({
      alreadyProcessed: true,
    });

    const [ledgerRows, grants] = await Promise.all([
      db.coinLedgerEntry.findMany({ where: { userId: learner.id } }),
      db.adminCoinGrant.findMany({ where: { recipientUserId: learner.id } }),
    ]);
    expect(ledgerRows).toHaveLength(1);
    expect(ledgerRows[0]).toMatchObject({
      amount: 175,
      reason: "admin_grant",
      seenAt: null,
    });
    expect(grants).toHaveLength(1);
    expect(grants[0]).toMatchObject({
      amount: 175,
      message: "Gracias por probar la nueva experiencia.",
      coinLedgerEntryId: ledgerRows[0]!.id,
    });
  });
});
