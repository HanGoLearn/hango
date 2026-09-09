import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { trackAiOperation } from "@/lib/ai-usage";
import { getAdminAiOperations } from "@/lib/admin-ai-operations";

const testEmails: string[] = [];

afterEach(async () => {
  if (testEmails.length) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

describe("admin AI operations (integration, real database)", () => {
  it("records safe success/failure metadata and exposes it in the dashboard", async () => {
    const email = `admin-ai-operations-${Date.now()}@hango.dev`;
    testEmails.push(email);
    const user = await db.user.create({ data: { email, name: "Ops learner" } });

    await trackAiOperation(
      {
        userId: user.id,
        feature: "vocabulary-lookup",
        provider: "test-provider",
      },
      async () => ({ provider: "test-provider", model: "test-model" }),
    );

    const providerError = Object.assign(new Error("private provider detail"), {
      code: "timeout",
    });
    await expect(
      trackAiOperation(
        {
          userId: user.id,
          feature: "vocabulary-lookup",
          provider: "test-provider",
          model: "test-model",
        },
        async () => {
          throw providerError;
        },
      ),
    ).rejects.toBe(providerError);

    const rows = await db.aiOperationLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    expect(rows.map((row) => row.outcome)).toEqual(["SUCCESS", "FAILURE"]);
    expect(rows[1]).toMatchObject({ errorCode: "timeout" });
    expect(JSON.stringify(rows)).not.toContain("private provider detail");

    const dashboard = await getAdminAiOperations(7, "not-a-real-user-id");
    const vocabulary = dashboard.byFeature.find(
      (row) => row.key === "vocabulary-lookup",
    );
    expect(vocabulary?.attempts).toBeGreaterThanOrEqual(2);
    expect(
      dashboard.incidents.some((incident) => incident.user.id === user.id),
    ).toBe(true);
  });
});
