"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InformationBanner } from "@/components/ui/banner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Body,
  Caption,
  CardTitle,
  PageTitle,
} from "@/components/ui/typography";
import { WritingFeedbackDisplay } from "@/components/writing/writing-feedback-display";
import { submitCustomWritingAction } from "@/lib/actions/writing";
import type { WritingFeedback } from "@/lib/writing-feedback";
import { tierNameForLevel } from "@/lib/points-system";
import type {
  DashboardMessages,
  WritingLabMessages,
} from "@/i18n/messages/types";
import { localizeWritingError } from "@/i18n/writing";

// Radix Select rejects an empty-string item value (same workaround as Speaking Lab's free-topic practice).
const PROFILE_LEVEL = "PROFILE";

// `value` is free text sent straight into the AI grading prompt (writing-
// feedback.ts's CustomWritingCharacteristics.level) - unlike Speaking Lab's
// free-topic level, nothing parses it back out with a regex, so only
// `label` needs to stay in sync with the app's tier names; `value` is kept
// as "HSK N" anyway for consistency with that other picker.
const LEVEL_OPTIONS = [
  { value: PROFILE_LEVEL, label: "Use my profile level" },
  { value: "HSK 1", label: tierNameForLevel(1) },
  { value: "HSK 2", label: tierNameForLevel(2) },
  { value: "HSK 3", label: tierNameForLevel(3) },
  { value: "HSK 4", label: tierNameForLevel(4) },
  { value: "HSK 5", label: tierNameForLevel(5) },
  { value: "HSK 6", label: tierNameForLevel(6) },
  { value: "HSK 7-9", label: tierNameForLevel(7) },
];

const FORMAT_OPTIONS: {
  key: keyof WritingLabMessages["custom"]["formats"];
  value: string;
}[] = [
  { key: "short", value: "a short message (2-3 sentences)" },
  { key: "paragraph", value: "a paragraph (4-6 sentences)" },
  {
    key: "practical",
    value: "a practical piece of writing, like a review or note",
  },
  { key: "essay", value: "a longer essay (8+ sentences)" },
];

const TONE_OPTIONS = ["casual", "formal"] as const;

type Stage = "setup" | "write" | "result";

/**
 * Writing Lab's third top-level option (user ask, 2026-08-08 round 2):
 * "redactar dependiendo de las características que le das" - the learner
 * states topic/level/format/tone themselves instead of picking a fixed
 * WritingTask, and grading is judged against exactly those characteristics
 * (writing-feedback.ts's buildCustomWritingFeedbackPrompt). No WritingTask
 * row (there's no fixed catalog entry for a prompt the learner made up),
 * but as of 2026-08-15 each submission does persist its own WritingAttempt
 * (taskId: null) so it counts toward Writing Lab points - "Try again"
 * intentionally starts a brand new attempt rather than editing the graded
 * one, same as the fixed-task Writing Lab flow.
 */
export function CustomWriting({
  onExit,
  messages,
  levelMessages,
}: {
  onExit: () => void;
  messages: WritingLabMessages;
  levelMessages: DashboardMessages["levels"];
}) {
  const [stage, setStage] = useState<Stage>("setup");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState(PROFILE_LEVEL);
  const [format, setFormat] = useState(FORMAT_OPTIONS[1]!.value);
  const [tone, setTone] = useState<"casual" | "formal">("casual");
  const [extra, setExtra] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const characteristics = {
    topic: topic.trim(),
    level: level === PROFILE_LEVEL ? undefined : level,
    format,
    tone,
    extra: extra.trim() || undefined,
  };
  const formatOption = FORMAT_OPTIONS.find((option) => option.value === format);
  const formatLabel = formatOption
    ? messages.custom.formats[formatOption.key]
    : format;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const result = await submitCustomWritingAction(characteristics, text);
    setSubmitting(false);
    if (result.ok) {
      setFeedback(result.feedback);
      setStage("result");
    } else {
      setError(localizeWritingError(result.error, messages.errors));
    }
  }

  function handleTryAgain() {
    setText("");
    setFeedback(null);
    setError(null);
    setStage("write");
  }

  if (stage === "setup") {
    return (
      <div className="flex flex-col gap-6">
        <Button
          type="button"
          variant="tertiary"
          className="w-fit gap-1.5 px-0"
          onClick={onExit}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {messages.common.back}
        </Button>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary-500" aria-hidden="true" />
            <PageTitle>{messages.home.customTitle}</PageTitle>
          </div>
          <Body className="text-text-secondary">
            {messages.custom.description}
          </Body>
        </div>

        <Card className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <Caption className="font-semibold uppercase tracking-wide text-text-secondary">
              {messages.custom.topic}
            </Caption>
            <Textarea
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder={messages.custom.topicPlaceholder}
              aria-label={messages.custom.topic}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <Caption className="font-semibold uppercase tracking-wide text-text-secondary">
              {messages.custom.level}
            </Caption>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger
                aria-label={messages.custom.level}
                className="max-w-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.value === PROFILE_LEVEL
                      ? messages.custom.useProfileLevel
                      : (levelMessages[
                          option.label as keyof typeof levelMessages
                        ] ?? option.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-col gap-1.5">
            <Caption className="font-semibold uppercase tracking-wide text-text-secondary">
              {messages.custom.format}
            </Caption>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger
                aria-label={messages.custom.format}
                className="max-w-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {messages.custom.formats[option.key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <div className="flex flex-col gap-1.5">
            <Caption className="font-semibold uppercase tracking-wide text-text-secondary">
              {messages.custom.tone}
            </Caption>
            <RadioGroup
              value={tone}
              onValueChange={(value) => setTone(value as "casual" | "formal")}
              className="flex flex-row gap-4"
            >
              {TONE_OPTIONS.map((option) => (
                <RadioGroupItem
                  key={option}
                  value={option}
                  label={messages.custom.tones[option]}
                />
              ))}
            </RadioGroup>
          </div>

          <label className="flex flex-col gap-1.5">
            <Caption className="font-semibold uppercase tracking-wide text-text-secondary">
              {messages.custom.extra}
            </Caption>
            <Textarea
              value={extra}
              onChange={(event) => setExtra(event.target.value)}
              placeholder={messages.custom.extraPlaceholder}
              aria-label={messages.custom.extraLabel}
            />
          </label>

          <Button
            type="button"
            className="w-fit"
            disabled={!topic.trim()}
            onClick={() => setStage("write")}
          >
            {messages.custom.start}
          </Button>
        </Card>
      </div>
    );
  }

  if (stage === "write") {
    return (
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-1">
          <CardTitle>{topic}</CardTitle>
          <Body className="text-text-secondary">
            {formatLabel} · {messages.custom.tones[tone]} ·{" "}
            {level === PROFILE_LEVEL ? messages.custom.profileLevel : level}
          </Body>
        </Card>

        {error && (
          <InformationBanner variant="error">
            <Body>{error}</Body>
          </InformationBanner>
        )}

        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={messages.custom.writingPlaceholder}
          aria-label={messages.custom.writingLabel}
          maxLength={2000}
          showCharacterCount
          disabled={submitting}
          className="min-h-40"
        />
        <Button
          type="button"
          className="w-fit"
          onClick={() => void handleSubmit()}
          disabled={!text.trim() || submitting}
          loading={submitting}
        >
          {messages.common.submit}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <WritingFeedbackDisplay
        original={text}
        feedback={feedback!}
        messages={messages.feedback}
      />
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={handleTryAgain}>
          {messages.common.tryAgain}
        </Button>
        <Button type="button" onClick={onExit}>
          {messages.common.done}
        </Button>
      </div>
    </div>
  );
}
