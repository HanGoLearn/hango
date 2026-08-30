import {
  Flame,
  Award,
  Star,
  CheckCircle,
  Trophy,
  GraduationCap,
  Mic,
  PenLine,
} from "lucide-react";
import type { AchievementDefinition } from "@/lib/achievements-catalog";

const ICONS = {
  Flame,
  Award,
  Star,
  CheckCircle,
  Trophy,
  GraduationCap,
  Mic,
  PenLine,
} as const;

/** Resolves a catalog entry's plain-string `iconName` to its lucide component - kept out of achievements-catalog.ts so that data module stays icon-component-free. */
export function AchievementIcon({
  name,
  className,
}: {
  name: AchievementDefinition["iconName"];
  className?: string;
}) {
  const Icon = ICONS[name];
  return <Icon className={className} aria-hidden="true" />;
}
