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
import { Body, Caption, CardTitle, PageTitle } from "@/components/ui/typography";
import { WritingFeedbackDisplay } from "@/components/writing/writing-feedback-display";
import { submitCustomWritingAction } from "@/lib/actions/writing";
import type { WritingFeedback } from "@/lib/writing-feedback";
import { tierNameForLevel } from "@/lib/points-system";

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

const FORMAT_OPTIONS = [
  { value: "a short message (2-3 sentences)", label: "Short message" },
  { value: "a paragraph (4-6 sentences)", label: "Paragraph" },
  { value: "a practical piece of writing, like a review or note", label: "Practical writing" },
  { value: "a longer essay (8+ sentences)", label: "Essay" },
];

const TONE_OPTIONS: { value: "casual" | "formal"; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
];

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
export function CustomWriting({ onExit }: { onExit: () => void }) {
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
  const formatLabel = FORMAT_OPTIONS.find((option) => option.value === format)?.label ?? format;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const result = await submitCustomWritingAction(characteristics, text);
    setSubmitting(false);
    if (result.ok) {
      setFeedback(result.feedback);
      setStage("result");
    } else {
      setError(result.error);
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
        <Button type="button" variant="tertiary" className="w-fit gap-1.5 px-0" onClick={onExit}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary-500" aria-hidden="true" />
            <PageTitle>Custom Writing</PageTitle>
          </div>
          <Body className="text-text-secondary">
            Set your own topic, level, format, and tone — Han grades your writing against exactly what you asked for.
          </Body>
        </div>

        <Card className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <Caption className="font-semibold uppercase tracking-wide text-text-secondary">
              Topic
            </Caption>
            <Textarea
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. Write about a memorable trip you took"
              aria-label="Topic"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <Caption className="font-semibold uppercase tracking-wide text-text-secondary">
              Level
            </Caption>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger aria-label="Level" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-col gap-1.5">
            <Caption className="font-semibold uppercase tracking-wide text-text-secondary">
              Format
            </Caption>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger aria-label="Format" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <div className="flex flex-col gap-1.5">
            <Caption className="font-semibold uppercase tracking-wide text-text-secondary">
              Tone
            </Caption>
            <RadioGroup
              value={tone}
              onValueChange={(value) => setTone(value as "casual" | "formal")}
              className="flex flex-row gap-4"
            >
              {TONE_OPTIONS.map((option) => (
                <RadioGroupItem key={option.value} value={option.value} label={option.label} />
              ))}
            </RadioGroup>
          </div>

          <label className="flex flex-col gap-1.5">
            <Caption className="font-semibold uppercase tracking-wide text-text-secondary">
              Anything else? (optional)
            </Caption>
            <Textarea
              value={extra}
              onChange={(event) => setExtra(event.target.value)}
              placeholder="e.g. Focus on restaurant vocabulary. Use at least one time expression."
              aria-label="Additional instructions"
            />
          </label>

          <Button
            type="button"
            className="w-fit"
            disabled={!topic.trim()}
            onClick={() => setStage("write")}
          >
            Start writing
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
            {formatLabel} · {tone === "formal" ? "Formal" : "Casual"} ·{" "}
            {level === PROFILE_LEVEL ? "Your profile level" : level}
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
          placeholder="Write your response in Chinese"
          aria-label="Your writing"
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
          Submit
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <WritingFeedbackDisplay original={text} feedback={feedback!} />
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={handleTryAgain}>
          Try again
        </Button>
        <Button type="button" onClick={onExit}>
          Done
        </Button>
      </div>
    </div>
  );
}
