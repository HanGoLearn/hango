"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiTeacher } from "@/components/ai-teacher/ai-teacher-provider";
import type { AiTeacherContext } from "@/lib/ai-context";

/**
 * Opens the AI Teacher (desktop panel or mobile drawer, whichever applies)
 * with the selected dialogue line/vocabulary/grammar point as context
 * (8.2, 8.3) - real conversation since FASE 8, replacing FASE 6's
 * placeholder.
 */
export function AskAiButton({
  label = "Ask AI",
  contextPatch,
}: {
  label?: string;
  contextPatch: Partial<AiTeacherContext>;
}) {
  const { openTeacher } = useAiTeacher();

  return (
    <Button
      type="button"
      variant="tertiary"
      className="w-fit gap-1.5 px-2 py-1"
      onClick={() => void openTeacher(contextPatch)}
    >
      <Sparkles className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
