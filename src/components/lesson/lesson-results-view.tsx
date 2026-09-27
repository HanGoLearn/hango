"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2 } from "lucide-react";
import { SectionTitle, Body } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalDescription,
  ModalClose,
} from "@/components/ui/modal";
import { getLessonReflectionReportAction } from "@/lib/actions/reflection";
import { redoLessonAction } from "@/lib/actions/scenario-completion";
import { ReflectionReport } from "@/components/lesson/steps/reflection-step";
import type { LessonReflectionReportView } from "@/lib/reflection";
import { useLessonMessages } from "@/components/lesson/lesson-messages";

type ReportState =
  | { status: "loading" }
  | { status: "ready"; report: LessonReflectionReportView }
  | { status: "error" };

/**
 * Shown instead of LessonEngine when a lesson is already completed
 * (2026-08-15 request: "finish lesson" should stop letting the learner
 * freely re-enter and redo steps - revisiting should surface the frozen
 * result, with an explicit "Try again" to reset it).
 */
export function LessonResultsView({
  lessonId,
  lessonTitle,
  lessonSlug,
  scenarioSlug,
}: {
  lessonId: string;
  lessonTitle: string;
  lessonSlug: string;
  scenarioSlug: string;
}) {
  const messages = useLessonMessages();
  const router = useRouter();
  const [state, setState] = useState<ReportState>({ status: "loading" });
  const [redoing, setRedoing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getLessonReflectionReportAction(lessonId).then((result) => {
      if (cancelled) return;
      setState(
        result.ok
          ? { status: "ready", report: result.report }
          : { status: "error" },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  async function handleRedo() {
    setRedoing(true);
    const result = await redoLessonAction(lessonId, lessonSlug, scenarioSlug);
    setRedoing(false);
    setConfirmOpen(false);
    if (result.ok) {
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>{lessonTitle}</SectionTitle>

      {state.status === "loading" && (
        <div className="flex items-center gap-2 rounded-panel border border-border bg-surface px-4 py-6 text-text-secondary">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <Body>{messages.results.loading}</Body>
        </div>
      )}

      {state.status === "error" && (
        <Body className="text-error-500" role="alert">
          {messages.results.error}
        </Body>
      )}

      {state.status === "ready" && (
        <ReflectionReport report={state.report} lessonId={lessonId} />
      )}

      <Modal open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Button
          type="button"
          variant="tertiary"
          onClick={() => setConfirmOpen(true)}
          className="self-start"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {messages.common.tryAgain}
        </Button>
        <ModalContent>
          {/* pr-10: the ES string ("¿Quieres repetir esta lección?") is long
              enough at the default max-w-md width to reach under the
              close button's enlarged 44px tap target in its top-right
              corner. */}
          <ModalTitle className="pr-10">
            {messages.results.tryAgainTitle}
          </ModalTitle>
          <ModalDescription>
            {messages.results.tryAgainDescription}
          </ModalDescription>
          <div className="mt-4 flex justify-end gap-2">
            <ModalClose asChild>
              <Button type="button" variant="tertiary">
                {messages.common.cancel}
              </Button>
            </ModalClose>
            <Button type="button" onClick={handleRedo} loading={redoing}>
              {messages.common.confirmTryAgain}
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
