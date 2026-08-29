"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Keyboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { InformationBanner } from "@/components/ui/banner";
import {
  HanVoiceConversation,
  type RealtimeConversationDiagnostics,
} from "@/components/ai-teacher/han-voice-conversation";
import { AiTeacherChat } from "@/components/ai-teacher/ai-teacher-chat";
import { useAiTeacher } from "@/components/ai-teacher/ai-teacher-provider";
import { SpeakingFeedbackDisplay } from "@/components/speaking/speaking-feedback-display";
import { getFreeTopicPracticeFeedbackAction } from "@/lib/actions/free-topic-practice";
import type { SpeakingTranscriptMessage } from "@/lib/reflection-prompt";
import type { SpeakingFeedback } from "@/lib/speaking-feedback";
import { SPEAKING_CLOSING_RESERVE_MS } from "@/lib/speaking-session-timing";
import type { SpeakingTurnEvidence } from "@/lib/speech/speaking-pronunciation-evidence";
import { buildFreeTopicRolePlay } from "@/lib/free-topic-role-play";
import { tierNameForLevel } from "@/lib/points-system";

// Radix Select rejects an empty-string item value, so "use my profile
// level" (level: undefined in rolePlay) is represented by this sentinel.
const PROFILE_LEVEL = "PROFILE";

// `value` must stay exactly "HSK N" / "HSK 7-9" - it's sent to the server
// as-is and han-realtime.ts parses that literal pattern (via a `/HSK\s*
// ([1-9])/` regex) to set the character limit and speech pace for this
// session. Only `label`, what the learner actually sees, is free to reword -
// now the same tierNameForLevel() names used everywhere else in the app
// (2026-08-27 audit: this used to be its own ad-hoc Beginner/Elementary/...
// scale, a second naming system that could disagree with the canonical one).
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

const PACE_OPTIONS: { value: "slow" | "normal" | "fast"; label: string }[] = [
  { value: "slow", label: "Slow" },
  { value: "normal", label: "Normal" },
  { value: "fast", label: "Fast" },
];

const ROLE_OPTIONS: {
  value: string;
  label: string;
  aiRole: string;
  displayLabel: string;
}[] = [
  {
    value: "AUTO",
    label: "Match the topic (default)",
    aiRole: "a conversation partner whose persona naturally fits the topic",
    displayLabel: "Han",
  },
  {
    value: "FRIEND",
    label: "A friend",
    aiRole: "a friend",
    displayLabel: "Han, as a friend",
  },
  {
    value: "COLLEAGUE",
    label: "A colleague",
    aiRole: "a colleague",
    displayLabel: "Han, as a colleague",
  },
  {
    value: "STRANGER",
    label: "A stranger",
    aiRole: "a stranger",
    displayLabel: "Han, as a stranger",
  },
  {
    value: "INTERVIEWER",
    label: "A job interviewer",
    aiRole: "a job interviewer",
    displayLabel: "Han, as a job interviewer",
  },
];

const CORRECTION_OPTIONS: {
  value: "scene" | "tutor";
  label: string;
  description: string;
}[] = [
  {
    value: "scene",
    label: "Stay in the scene",
    description:
      "Han stays fully in character in Mandarin - feedback only at the end (default).",
  },
  {
    value: "tutor",
    label: "Correct me as we talk",
    description:
      "Han briefly explains pronunciation, tone, or grammar mistakes right when they happen.",
  },
];

type Stage = "setup" | "live" | "results";

/**
 * Speaking Lab's second top-level option (alongside the 4 structured
 * modes): a free-topic voice conversation with Han, built with the
 * learner's own topic/level/pace/extra instructions instead of fixed
 * lesson content - reuses the exact same real-time voice mechanism as the
 * lesson Speaking step (HanVoiceConversation immersive + RolePlayContext),
 * per the user's explicit request (2026-08-08). Feedback after the
 * conversation is one AI call (reflection-prompt.ts's existing rubric),
 * not per-turn - same cost shape as Reflection.
 */
export function FreeTopicPractice({ onExit }: { onExit: () => void }) {
  const {
    voice,
    explanationLanguage,
    appendRealtimeMessage,
    setMode,
    setContext,
  } = useAiTeacher();
  const [stage, setStage] = useState<Stage>("setup");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState(PROFILE_LEVEL);
  const [pace, setPace] = useState<"slow" | "normal" | "fast">("normal");
  const [role, setRole] = useState(ROLE_OPTIONS[0]!.value);
  const [correctionMode, setCorrectionMode] = useState<"scene" | "tutor">(
    "scene",
  );
  const [extra, setExtra] = useState("");
  const [fallbackVisible, setFallbackVisible] = useState(false);
  const [feedback, setFeedback] = useState<
    SpeakingFeedback | null | "loading" | "not-enough"
  >(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState<
    SpeakingTranscriptMessage[] | null
  >(null);
  const [lastSpeakingEvidence, setLastSpeakingEvidence] = useState<
    SpeakingTurnEvidence[]
  >([]);

  const selectedRole =
    ROLE_OPTIONS.find((option) => option.value === role) ?? ROLE_OPTIONS[0]!;

  const rolePlay = useMemo(
    () =>
      buildFreeTopicRolePlay({
        topic,
        extraInstructions: extra,
        selectedAiRole: selectedRole.aiRole,
        useScenarioRole: selectedRole.value === "AUTO",
        level: level === PROFILE_LEVEL ? undefined : level,
        pace,
        correctionMode,
      }),
    [selectedRole, topic, level, pace, extra, correctionMode],
  );

  function handleStart() {
    setMode("PRACTICE");
    setContext({ rolePlay });
    setFallbackVisible(false);
    setStage("live");
  }

  const handleUnavailable = useCallback(() => setFallbackVisible(true), []);
  const handleActiveChange = useCallback(() => undefined, []);

  const requestFeedback = useCallback(
    async (
      transcript: SpeakingTranscriptMessage[],
      speakingEvidence: SpeakingTurnEvidence[],
    ) => {
      setFeedback("loading");
      setFeedbackError(null);
      const result = await getFreeTopicPracticeFeedbackAction(
        topic,
        transcript,
        speakingEvidence,
      );
      if (!result.ok) {
        // A real error (not authenticated, rate-limited, or an unexpected
        // failure) must never be silently swapped for fabricated scores -
        // that looked like real feedback and wasn't (user report, 2026-08-08).
        setFeedback(null);
        setFeedbackError(result.error);
        return;
      }
      setFeedback(result.feedback === null ? "not-enough" : result.feedback);
    },
    [topic],
  );

  const handleComplete = useCallback(
    async (
      transcript: SpeakingTranscriptMessage[],
      diagnostics: RealtimeConversationDiagnostics,
    ) => {
      setStage("results");
      setLastTranscript(transcript);
      setLastSpeakingEvidence(diagnostics.speakingEvidence);
      await requestFeedback(transcript, diagnostics.speakingEvidence);
    },
    [requestFeedback],
  );

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
          Back
        </Button>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary-500" aria-hidden="true" />
            <PageTitle>Practice with Han</PageTitle>
          </div>
          <Body className="text-text-secondary">
            Pick a topic and how you want Han to run it — a live spoken
            conversation, just like the Learning Journey&apos;s Speaking step.
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
              placeholder="e.g. Talk about my weekend trip to Beijing"
              aria-label="Topic"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <Caption className="font-semibold uppercase tracking-wide text-text-secondary">
              Who is Han?
            </Caption>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger aria-label="Han's role" className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <div className="flex flex-col gap-1.5">
            <Caption className="font-semibold uppercase tracking-wide text-text-secondary">
              Speed
            </Caption>
            <RadioGroup
              value={pace}
              onValueChange={(value) =>
                setPace(value as "slow" | "normal" | "fast")
              }
              className="flex flex-row gap-4"
            >
              {PACE_OPTIONS.map((option) => (
                <RadioGroupItem
                  key={option.value}
                  value={option.value}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </div>

          <div className="flex flex-col gap-1.5">
            <Caption className="font-semibold uppercase tracking-wide text-text-secondary">
              When should Han correct me?
            </Caption>
            <RadioGroup
              value={correctionMode}
              onValueChange={(value) =>
                setCorrectionMode(value as "scene" | "tutor")
              }
              className="flex flex-col gap-2"
            >
              {CORRECTION_OPTIONS.map((option) => (
                <div key={option.value} className="flex flex-col gap-0.5">
                  <RadioGroupItem value={option.value} label={option.label} />
                  <Caption className="pl-7 text-text-secondary">
                    {option.description}
                  </Caption>
                </div>
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
              placeholder="e.g. Be more formal. Focus on restaurant vocabulary. Correct my tones when I finish."
              aria-label="Additional instructions"
            />
          </label>

          <Button
            type="button"
            className="w-fit"
            disabled={!topic.trim()}
            onClick={handleStart}
          >
            Start conversation
          </Button>
        </Card>
      </div>
    );
  }

  if (stage === "live") {
    return (
      <div className="flex flex-col gap-4">
        {!fallbackVisible ? (
          <>
            <HanVoiceConversation
              disabled={false}
              voice={voice}
              explanationLanguage={explanationLanguage}
              mode="PRACTICE"
              context={{ rolePlay }}
              open
              variant="immersive"
              roleLabel={selectedRole.displayLabel}
              appendMessage={appendRealtimeMessage}
              onActiveChange={handleActiveChange}
              onUnavailable={handleUnavailable}
              onComplete={handleComplete}
              naturalCloseAfterMs={4 * 60 * 1000}
              maxSessionMs={4 * 60 * 1000 + SPEAKING_CLOSING_RESERVE_MS}
            />
            <Button
              type="button"
              variant="tertiary"
              className="w-fit gap-1.5 px-0"
              onClick={() => setFallbackVisible(true)}
            >
              <Keyboard className="size-4" aria-hidden="true" />
              Use text instead
            </Button>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Keyboard
                className="size-4 text-text-secondary"
                aria-hidden="true"
              />
              <Body className="text-text-secondary">
                Microphone unavailable — practice this topic by text instead.
              </Body>
            </div>
            <div className="h-[28rem] rounded-card border border-border bg-surface p-4">
              <AiTeacherChat voiceEnabled={false} />
            </div>
            <Button
              type="button"
              variant="secondary"
              className="w-fit"
              onClick={onExit}
            >
              Back to Speaking Lab
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-success-500">
        <CheckCircle2 className="size-5" aria-hidden="true" />
        <CardTitle>Conversation complete</CardTitle>
      </div>

      {feedback === "loading" && (
        <Body className="text-text-secondary">Getting your feedback…</Body>
      )}
      {feedback === "not-enough" && (
        <Body className="text-text-secondary">
          That conversation was too short to score — try again and speak a bit
          more.
        </Body>
      )}
      {feedbackError && (
        <div className="flex flex-col items-start gap-2">
          <InformationBanner variant="error">
            <Body>{feedbackError}</Body>
          </InformationBanner>
          {lastTranscript && (
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                void requestFeedback(lastTranscript, lastSpeakingEvidence)
              }
            >
              Try getting feedback again
            </Button>
          )}
        </div>
      )}
      {feedback && feedback !== "loading" && feedback !== "not-enough" && (
        <SpeakingFeedbackDisplay
          transcript={`Live conversation about: ${topic}`}
          feedback={feedback}
        />
      )}

      <Button type="button" onClick={onExit}>
        Back to Speaking Lab
      </Button>
    </div>
  );
}
