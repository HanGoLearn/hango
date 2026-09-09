import { randomUUID } from "node:crypto";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { grantAdminCoins } from "@/lib/admin-communications";
import { getAdminOverview, getAdminUserDetail } from "@/lib/admin-dashboard";
import {
  acknowledgeAnnouncementForUser,
  getPendingAnnouncementsForUser,
} from "@/lib/learner-notices";

const ADMIN_EMAIL = "arean.mendoza@unmsm.edu.pe";

const testUserIds: string[] = [];
const testAnnouncementIds: string[] = [];

beforeAll(async () => {
  // A force-stopped local run can skip afterEach. These prefixes belong only
  // to this file, so cleaning them here cannot touch product or learner data.
  await db.user.deleteMany({
    where: {
      OR: [
        { email: { startsWith: "admin-notice-", endsWith: "@hango.dev" } },
        { email: { startsWith: "learner-notice-", endsWith: "@hango.dev" } },
        { email: { startsWith: "admin-coins-", endsWith: "@hango.dev" } },
        { email: { startsWith: "learner-coins-", endsWith: "@hango.dev" } },
        { email: { startsWith: "admin-user-360-", endsWith: "@hango.dev" } },
      ],
    },
  });
});

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
    expect(firstVisit.map((announcement) => announcement.id)).toContain(
      active.id,
    );
    expect(firstVisit.map((announcement) => announcement.id)).not.toContain(
      draft.id,
    );
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
    expect(
      (await getPendingAnnouncementsForUser(learner.id)).map(
        (announcement) => announcement.id,
      ),
    ).not.toContain(active.id);
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

  it("builds an honest 360-degree user view without mixing product surfaces", async () => {
    const learner = await createUser("admin-user-360");
    const now = new Date();
    await Promise.all([
      db.learnerProfile.create({
        data: {
          userId: learner.id,
          displayName: "Learner 360",
          generalLevelPoints: 175,
          aiConversationStorageEnabled: true,
        },
      }),
      db.learnerActivitySession.createMany({
        data: [
          {
            userId: learner.id,
            clientSessionId: "admin-360-session",
            surface: "HAN_TUTOR",
            path: "/han",
            startedAt: new Date(now.getTime() - 120_000),
            lastActiveAt: now,
            activeSeconds: 120,
            interactionCount: 4,
            lastSequence: 8,
          },
          {
            userId: learner.id,
            clientSessionId: "admin-360-session",
            surface: "HAN_COMPANION",
            path: "/han",
            startedAt: new Date(now.getTime() - 90_000),
            lastActiveAt: now,
            activeSeconds: 90,
            interactionCount: 3,
            lastSequence: 6,
          },
          {
            userId: learner.id,
            clientSessionId: "admin-360-session",
            surface: "SPEAKING_LAB",
            path: "/speaking-lab",
            startedAt: new Date(now.getTime() - 45_000),
            lastActiveAt: now,
            activeSeconds: 45,
            interactionCount: 2,
            lastSequence: 3,
          },
        ],
      }),
      db.aiUsageLog.createMany({
        data: [
          {
            userId: learner.id,
            feature: "ai-teacher-chat",
            provider: "openai",
            model: "gpt-test",
            inputTokens: 100,
            outputTokens: 50,
            estimatedCostUsd: 0.01,
            calculationMethod: "TOKEN_RATES",
            inputRateUsdPerMillionTokens: 1,
            outputRateUsdPerMillionTokens: 2,
          },
          {
            userId: learner.id,
            feature: "speaking-transcribe",
            provider: "openai",
            model: "whisper-test",
            estimatedCostUsd: 0.006,
            calculationMethod: "PER_MINUTE",
            audioRateUsdPerMinute: 0.006,
            durationSeconds: 60,
            durationSource: "CLIENT_RECORDED",
          },
        ],
      }),
      db.aiConversation.create({
        data: {
          userId: learner.id,
          messages: {
            create: [
              {
                role: "USER",
                content: "Explícame 你好.",
                contextSnapshot: { currentPageName: "Han" },
              },
              {
                role: "ASSISTANT",
                content: "你好 significa hola.",
                contextSnapshot: { currentPageName: "Han" },
              },
              {
                role: "USER",
                content: "Mensaje de práctica oral separado",
                contextSnapshot: {
                  rolePlay: {
                    aiRole: "waiter",
                    learnerRole: "customer",
                    scenarioContext: "restaurant",
                    objective: "order food",
                  },
                },
              },
            ],
          },
        },
      }),
    ]);

    const detail = await getAdminUserDetail(learner.id);

    expect(detail).not.toBeNull();
    expect(detail?.activity.thirtyDaySeconds).toBe(255);
    expect(
      detail?.activity.bySurface.find((row) => row.surface === "HAN_TUTOR"),
    ).toMatchObject({ activeSeconds: 120, interactions: 4, sessions: 1 });
    expect(
      detail?.activity.bySurface.find((row) => row.surface === "HAN_COMPANION"),
    ).toMatchObject({ activeSeconds: 90, interactions: 3, sessions: 1 });
    expect(
      detail?.activity.bySurface.find((row) => row.surface === "SPEAKING_LAB"),
    ).toMatchObject({ activeSeconds: 45, interactions: 2, sessions: 1 });
    expect(detail?.monthAiCostUsd).toBeCloseTo(0.016);
    expect(detail?.aiByFeature).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          feature: "ai-teacher-chat",
          calls: 1,
          inputTokens: 100,
          outputTokens: 50,
        }),
        expect.objectContaining({
          feature: "speaking-transcribe",
          calls: 1,
          durationSeconds: 60,
        }),
      ]),
    );
    expect(detail?.hanHistory.storedMessageCount).toBe(3);
    const visibleHanMessages = detail?.hanHistory.recentMessages.map(
      (message) => message.content,
    );
    expect(visibleHanMessages).toEqual(
      expect.arrayContaining(["Explícame 你好.", "你好 significa hola."]),
    );
    expect(visibleHanMessages).not.toContain(
      "Mensaje de práctica oral separado",
    );
  });

  it("excludes the real administrator's own AI usage from getAdminOverview (2026-09-08 optimization safety net)", async () => {
    // Reads the REAL admin User row by email (it always exists - this is
    // the live account) but never creates, deletes, or modifies it - only
    // attaches and then removes its own marker-tagged AiUsageLog rows, so
    // this test can never collide with or corrupt the real account.
    const admin = await db.user.findUniqueOrThrow({
      where: { email: ADMIN_EMAIL },
      select: { id: true },
    });
    const learner = await createUser("admin-overview-exclusion");
    const marker = `admin-overview-exclusion-${randomUUID()}`;

    try {
      await db.aiUsageLog.createMany({
        data: [
          {
            userId: admin.id,
            feature: "vocabulary-lookup",
            provider: marker,
            model: "test-model",
            estimatedCostUsd: 999,
          },
          {
            userId: learner.id,
            feature: "vocabulary-lookup",
            provider: marker,
            model: "test-model",
            estimatedCostUsd: 0.5,
          },
        ],
      });

      const overview = await getAdminOverview(admin.id);

      expect(
        overview.topAiUsers.some((user) => user.id === admin.id),
      ).toBe(false);
      // The admin's $999 entry must not leak into the shared monthly total -
      // the strongest possible sign the exclusion filter still works.
      expect(overview.ai.monthCostUsd).toBeLessThan(999);
    } finally {
      await db.aiUsageLog.deleteMany({ where: { provider: marker } });
    }
  });
});
