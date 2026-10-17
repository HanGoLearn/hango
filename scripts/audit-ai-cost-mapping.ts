// Read-only verification. Does not call an AI provider, write usage, reset a
// budget, expose account identities, or print connection credentials.
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  AI_USAGE_FEATURES,
  aiFeatureDescriptor,
} from "../src/lib/ai-feature-catalog";
import { buildAdminAiCostReport } from "../src/lib/admin-ai-cost-report";
import {
  AI_EXPERIENCE_IDS,
  experienceForLimitKey,
  recordedAiExperience,
} from "../src/lib/ai-experiences";
config({ path: ".env.local", quiet: true });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }),
});
async function main() {
  const [groups, caps, overrides, migrations] = await Promise.all([
    db.aiUsageLog.groupBy({
      by: ["feature", "experience"],
      _sum: { estimatedCostUsd: true },
      _count: { _all: true },
    }),
    db.aiUsageCap.findMany({ select: { feature: true, dailyLimitUsd: true } }),
    db.aiUsageUserCap.groupBy({ by: ["feature"], _count: { _all: true } }),
    db.$queryRaw<{ migration_name: string; finished_at: Date | null }[]>`
      SELECT "migration_name", "finished_at" FROM "_prisma_migrations"
      WHERE "migration_name" IN ('20261010120000_separate_realtime_usage_limits', '20261010130000_separate_han_text_usage_limits', '20261010140000_shared_ai_experience_budgets')
        AND "rolled_back_at" IS NULL
    `,
  ]);
  const rows = groups.map((group) => ({
    feature: group.feature,
    experience: group.experience,
    provider: "aggregate",
    model: "aggregate",
    calls: group._count._all,
    costUsd: group._sum.estimatedCostUsd ?? 0,
    calculationMethod: "LEGACY_ESTIMATE",
    durationSeconds: 0,
    inputRateUsdPerMillionTokens: null,
    outputRateUsdPerMillionTokens: null,
    audioRateUsdPerMinute: null,
  }));
  const report = buildAdminAiCostReport(rows);
  const recordedCostUsd = rows.reduce((total, row) => total + row.costUsd, 0);
  const recordedCalls = rows.reduce((total, row) => total + row.calls, 0);
  const reconciled =
    Math.abs(report.totalCostUsd - recordedCostUsd) < 0.00000001 &&
    report.totalCalls === recordedCalls;
  console.log(
    JSON.stringify(
      {
        readOnly: true,
        migrations: migrations.map((row) => ({
          name: row.migration_name,
          applied: row.finished_at !== null,
        })),
        catalogueFeatures: AI_USAGE_FEATURES.length,
        experienceBudgets: AI_EXPERIENCE_IDS.length,
        invalidAttributedFeatures: groups
          .filter(
            (row) =>
              row.experience &&
              !recordedAiExperience(row.feature, row.experience),
          )
          .map((row) => ({ feature: row.feature, experience: row.experience })),
        unknownRecordedFeatures: groups
          .filter((row) => !aiFeatureDescriptor(row.feature))
          .map((row) => row.feature),
        costReconciles: reconciled,
        recordedCostUsd,
        reportedCostUsd: report.totalCostUsd,
        recordedCalls,
        sharedGenerationCostUsd: report.sharedCostUsd,
        independentLimits: caps.filter(
          (row) => experienceForLimitKey(row.feature) !== null,
        ),
        overrideCounts: overrides
          .filter((row) => experienceForLimitKey(row.feature) !== null)
          .map((row) => ({ feature: row.feature, count: row._count._all })),
      },
      null,
      2,
    ),
  );
  if (!reconciled) process.exitCode = 1;
}
main()
  .catch(() => {
    console.error(
      "Read-only accounting audit failed; connection details were not printed.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
