"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Body } from "@/components/ui/typography";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalDescription,
  ModalClose,
} from "@/components/ui/modal";
import { redoLessonAction } from "@/lib/actions/scenario-completion";
import { useLessonMessages } from "@/components/lesson/lesson-messages";

/** Explicit confirmation reuses the existing own-lesson reset. Never resets
 * scores just by opening a partial/failed report. Paid usage is preserved. */
export function LessonRedoControl({
  lessonId,
  lessonSlug,
  scenarioSlug,
}: {
  lessonId: string;
  lessonSlug: string;
  scenarioSlug: string;
}) {
  const messages = useLessonMessages();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState(false);
  async function redo() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(false);
    try {
      const result = await redoLessonAction(lessonId, lessonSlug, scenarioSlug);
      if (!result.ok) {
        setError(true);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="tertiary"
        onClick={() => setOpen(true)}
        className="self-start"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        {messages.common.tryAgain}
      </Button>
      <ModalContent>
        <ModalTitle className="pr-10">
          {messages.results.tryAgainTitle}
        </ModalTitle>
        <ModalDescription>
          {messages.results.tryAgainDescription}
        </ModalDescription>
        {error && (
          <Body role="alert" className="mt-3 text-error-500">
            {messages.header.saveError}
          </Body>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <ModalClose asChild>
            <Button type="button" variant="tertiary" disabled={busy}>
              {messages.common.cancel}
            </Button>
          </ModalClose>
          <Button
            type="button"
            onClick={() => void redo()}
            disabled={busy}
            loading={busy}
          >
            {messages.common.confirmTryAgain}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
