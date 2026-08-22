import { CheckCircle2, PlayCircle, Lock } from "lucide-react";
import type { LessonAvailabilityStatus } from "@/lib/content/learning-journey";

const CONFIG: Record<
  LessonAvailabilityStatus,
  { label: string; icon: typeof Lock }
> = {
  LOCKED: { label: "Locked", icon: Lock },
  AVAILABLE: { label: "Available", icon: PlayCircle },
  COMPLETED: { label: "Completed", icon: CheckCircle2 },
};

export function LessonAvailabilityBadge({
  status,
}: {
  status: LessonAvailabilityStatus;
}) {
  const { label, icon: Icon } = CONFIG[status];
  return (
    <span className="flex items-center gap-1.5 text-supporting text-text-secondary">
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </span>
  );
}
