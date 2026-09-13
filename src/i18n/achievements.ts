import type { AchievementDefinition } from "@/lib/achievements-catalog";
import type { AchievementsMessages } from "@/i18n/messages/types";

export function localizeAchievement(
  achievement: Pick<AchievementDefinition, "key" | "title" | "description">,
  messages: AchievementsMessages,
): { title: string; description: string } {
  const item = messages.items[achievement.key as keyof typeof messages.items];
  return (
    item ?? {
      title: achievement.title,
      description: achievement.description,
    }
  );
}
