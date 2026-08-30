import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  ACHIEVEMENTS,
  CATEGORY_LABELS,
  type AchievementCategory,
} from "@/lib/achievements-catalog";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import { PageTitle, SectionTitle, Body, Caption } from "@/components/ui/typography";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/cn";

const CATEGORY_ORDER: AchievementCategory[] = [
  "STREAK",
  "LEVEL",
  "MASTERY",
  "PROGRESS",
  "COMMUNITY",
];

/**
 * Full achievements catalog (2026-08-29) - same server-component shape as
 * /leaderboard: one query against the real unlock registry, cross-referenced
 * against the fixed code catalog. Locked tiles render dimmed, unlocked
 * tiles show their real `unlockedAt` date - the permanent record the user
 * asked for, not a client-side "have I seen this" flag.
 */
export default async function AchievementsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const unlockedRows = await db.achievement.findMany({
    where: { userId },
    select: { key: true, unlockedAt: true },
  });
  const unlockedAtByKey = new Map(
    unlockedRows.map((row) => [row.key, row.unlockedAt]),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <PageTitle>Achievements</PageTitle>
        <Body className="text-text-secondary">
          {unlockedAtByKey.size} of {ACHIEVEMENTS.length} unlocked
        </Body>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const items = ACHIEVEMENTS.filter((a) => a.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category} className="flex flex-col gap-3">
            <SectionTitle>{CATEGORY_LABELS[category]}</SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((achievement) => {
                const unlockedAt = unlockedAtByKey.get(achievement.key);
                const unlocked = unlockedAt !== undefined;
                return (
                  <div
                    key={achievement.key}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-panel border px-4 py-5 text-center",
                      unlocked
                        ? "border-accent-500/40 bg-accent-500/10"
                        : "border-border bg-surface opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-12 items-center justify-center rounded-full",
                        unlocked
                          ? "bg-accent-500 text-on-color-dark"
                          : "bg-elevated text-text-muted",
                      )}
                    >
                      <AchievementIcon
                        name={achievement.iconName}
                        className="size-6"
                      />
                    </span>
                    <span className="font-interface text-supporting font-semibold text-text-primary">
                      {achievement.title}
                    </span>
                    <Caption className="text-text-secondary">
                      {achievement.description}
                    </Caption>
                    {unlockedAt && (
                      <Chip tone="accent" size="sm">
                        {unlockedAt.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </Chip>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
