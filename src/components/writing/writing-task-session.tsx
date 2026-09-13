"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { CardTitle, Body } from "@/components/ui/typography";
import { LoadingState } from "@/components/ui/states";
import { WritingEditor } from "@/components/writing/writing-editor";
import { WritingFeedbackDisplay } from "@/components/writing/writing-feedback-display";
import {
  getOrCreateDraftAttemptAction,
  submitWritingAttemptAction,
  createRewriteAttemptAction,
  type SubmitWritingResult,
} from "@/lib/actions/writing";
import type { WritingLabMessages } from "@/i18n/messages/types";
import { localizeWritingError } from "@/i18n/writing";

export interface WritingTaskSummary {
  id: string;
  type: string;
  title: string;
  prompt: string;
}

export function WritingTaskSession({
  task,
  onDone,
  messages,
}: {
  task: WritingTaskSummary;
  onDone: () => void;
  messages: WritingLabMessages;
}) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitWritingResult | null>(null);
  const [submittedText, setSubmittedText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getOrCreateDraftAttemptAction(task.id).then(
      ({ attemptId: id, draft: existingDraft }) => {
        setAttemptId(id);
        setDraft(existingDraft);
      },
    );
  }, [task.id]);

  async function handleSubmit(text: string) {
    if (!attemptId) return;
    setSubmitting(true);
    const submitResult = await submitWritingAttemptAction(attemptId);
    setSubmitting(false);
    if (submitResult.ok) {
      setError(null);
      setSubmittedText(text);
      setResult(submitResult.result);
    } else {
      setError(localizeWritingError(submitResult.error, messages.errors));
    }
  }

  async function handleRewrite() {
    if (!attemptId) return;
    const { attemptId: newAttemptId } =
      await createRewriteAttemptAction(attemptId);
    setAttemptId(newAttemptId);
    setDraft("");
    setResult(null);
    setSubmittedText("");
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-2">
        <CardTitle>{task.title}</CardTitle>
        <Body className="text-text-secondary">{task.prompt}</Body>
      </Card>

      {error && (
        <InformationBanner variant="error">
          <Body>{error}</Body>
        </InformationBanner>
      )}

      {!attemptId ? (
        <LoadingState message={messages.editor.loadingDraft} />
      ) : !result ? (
        <WritingEditor
          attemptId={attemptId}
          initialDraft={draft}
          onSubmit={(text) => void handleSubmit(text)}
          submitting={submitting}
          messages={messages}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <WritingFeedbackDisplay
            original={submittedText}
            feedback={result.feedback}
            messages={messages.feedback}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleRewrite()}
            >
              {messages.common.rewrite}
            </Button>
            <Button type="button" onClick={onDone}>
              {messages.common.done}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
