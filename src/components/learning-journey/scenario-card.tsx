import Link from "next/link";
import { CheckCircle2, PlayCircle, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CardTitle, Body, Caption } from "@/components/ui/typography";
import type { ScenarioStatus } from "@/lib/content/learning-journey";

export interface ScenarioCardProps {
  slug: string;
  name: string;
  domainName: string;
  description: string | null;
  difficultyLevels: string[];
  totalLessons: number;
  completedLessons: number;
  status: ScenarioStatus;
}

const STATUS_CONFIG: Record<
  ScenarioStatus,
  { label: string; icon: typeof CheckCircle2; action: string }
> = {
  AVAILABLE: { label: "Available", icon: Circle, action: "Start" },
  IN_PROGRESS: { label: "In progress", icon: PlayCircle, action: "Continue" },
  COMPLETED: { label: "Completed", icon: CheckCircle2, action: "Review" },
};

export function ScenarioCard({
  slug,
  name,
  domainName,
  description,
  difficultyLevels,
  totalLessons,
  completedLessons,
  status,
}: ScenarioCardProps) {
  const { label, icon: StatusIcon, action } = STATUS_CONFIG[status];
  const progressPercent =
    totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <Link href={`/learning-journey/${slug}`} className="block">
      <Card interactive className="flex h-full flex-col gap-2">
        <Caption>{domainName}</Caption>
        <CardTitle>{name}</CardTitle>
        {description && (
          <Body className="text-text-secondary">{description}</Body>
        )}

        {difficultyLevels.length > 0 && (
          <Caption>{difficultyLevels.join(" · ")}</Caption>
        )}

        {totalLessons > 0 && (
          <ProgressBar
            value={progressPercent}
            label={`${completedLessons} of ${totalLessons} lessons`}
          />
        )}

        <div className="mt-auto flex items-center gap-1.5 pt-2 text-supporting text-text-secondary">
          <StatusIcon className="size-4" aria-hidden="true" />
          <span>{label}</span>
          <span className="ml-auto font-medium text-primary-300">{action}</span>
        </div>
      </Card>
    </Link>
  );
}
