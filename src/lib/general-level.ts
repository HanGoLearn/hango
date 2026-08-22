import "server-only";
import { db } from "@/lib/db";
import { computeLabPoints } from "@/lib/lab-points";

/**
 * The single place LearnerProfile.generalLevelPoints gets recomputed
 * (docs/02_academy/points_system.md) - always derived fresh from source
 * (sum of ScenarioCompletion.earnedPoints + live Lab points), never
 * incremented, so any change anywhere (a scenario redo, a new Writing/
 * Speaking submission) is reflected correctly with no separate
 * reconciliation step. Call this after anything that could change either
 * source: scenario completion/redo (scenario-completion.ts),
 * a Writing Lab submission (writing-data.ts), or a completed Speaking Lab
 * session (speaking-data.ts).
 */
export async function recomputeGeneralLevelPoints(userId: string): Promise<void> {
  const [scenarioTotal, labPoints] = await Promise.all([
    db.scenarioCompletion.aggregate({
      where: { userId },
      _sum: { earnedPoints: true },
    }),
    computeLabPoints(userId),
  ]);
  const generalLevelPoints = (scenarioTotal._sum.earnedPoints ?? 0) + labPoints.total;
  await db.learnerProfile.update({
    where: { userId },
    data: { generalLevelPoints },
  });
}
