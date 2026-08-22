"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Caption } from "@/components/ui/typography";
import { saveDraftAction } from "@/lib/actions/writing";

const AUTOSAVE_DELAY_MS = 1200;
const MAX_LENGTH = 2000;

/**
 * The Writing Editor (11.4): character count, debounced autosave, and a
 * `beforeunload` guard so a learner can't accidentally navigate away with
 * unsaved text. Draft restoration itself happens one level up
 * (WritingTaskSession passes in `initialDraft` from the resumed attempt).
 */
export function WritingEditor({
  attemptId,
  initialDraft,
  onSubmit,
  submitting,
}: {
  attemptId: string;
  initialDraft: string;
  onSubmit: (text: string) => void;
  submitting: boolean;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (dirty) event.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleChange(value: string) {
    setDraft(value);
    setDirty(true);
    setSaveError(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSaving(true);
      void saveDraftAction(attemptId, value)
        .then(() => {
          setDirty(false);
        })
        .catch(() => {
          // Failed autosave (16.6): leave `dirty` true so the banner below
          // and the beforeunload guard both keep protecting this draft —
          // never silently claim "Saved" when it wasn't.
          setSaveError(true);
        })
        .finally(() => {
          setSaving(false);
        });
    }, AUTOSAVE_DELAY_MS);
  }

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={draft}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Write your response in Chinese"
        aria-label="Your writing"
        maxLength={MAX_LENGTH}
        showCharacterCount
        disabled={submitting}
        className="min-h-40"
      />
      <div className="flex items-center justify-between">
        <Caption role="status">
          {saving
            ? "Saving..."
            : saveError
              ? "Couldn't save — check your connection"
              : dirty
                ? "Unsaved changes"
                : "Saved"}
        </Caption>
        <Button
          type="button"
          onClick={() => onSubmit(draft)}
          disabled={!draft.trim() || submitting}
          loading={submitting}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
