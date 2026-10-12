"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { HanVoiceConversation } from "@/components/ai-teacher/han-voice-conversation";
import { InformationBanner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Body, Caption, SectionTitle } from "@/components/ui/typography";
import {
  gradePlacementSpeakingAction,
  startPlacementSpeakingAttemptAction,
} from "@/lib/actions/placement-exam";
import { tierNameForLevel } from "@/lib/points-system";
import type { AiChatMessage } from "@/components/ai-teacher/ai-teacher-provider";
import {
  PLACEMENT_SPEAKING_MAX_TURNS,
  PLACEMENT_SPEAKING_MIN_TURNS,
  PLACEMENT_SPEAKING_SCENARIOS,
  type PlacementSpeakingLevel,
} from "@/lib/placement-speaking";
import type { SpeakingTranscriptMessage } from "@/lib/reflection-prompt";
import type { RealtimeConversationDiagnostics } from "@/components/ai-teacher/han-voice-conversation";
import type { OnboardingMessages } from "@/i18n/messages/types";
import { formatMessage } from "@/i18n/format";

export interface PlacementSpeakingOutcome {
  creditedLevel: number;
  diagnosticLevel: PlacementSpeakingLevel | null;
}

export function PlacementSpeakingExam({
  sessionId,
  startingLevel,
  onFinished,
  messages,
  levelMessages,
}: {
  sessionId: string;
  startingLevel: PlacementSpeakingLevel;
  onFinished: (outcome: PlacementSpeakingOutcome) => void;
  messages: OnboardingMessages["placementExam"]["speaking"];
  levelMessages: OnboardingMessages["placementExam"]["levels"];
}) {
  const [attempt, setAttempt] = useState<{
    attemptId: string;
    level: PlacementSpeakingLevel;
  } | null>(null);
  const [loadingAttempt, setLoadingAttempt] = useState(true);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPassedScore, setLastPassedScore] = useState<number | null>(null);
  const level = attempt?.level ?? startingLevel;
  const scenario = PLACEMENT_SPEAKING_SCENARIOS[level];
  const context = useMemo(() => ({ rolePlay: scenario.rolePlay }), [scenario]);
  const appendMessage = useCallback(
    (_message: Omit<AiChatMessage, "id">) => undefined,
    [],
  );
  const handleActiveChange = useCallback((_active: boolean) => undefined, []);
  function localizedTier(level: number) {
    const tier = tierNameForLevel(level);
    return levelMessages[tier as keyof typeof levelMessages] ?? tier;
  }

  const loadAttempt = useCallback(async () => {
    setLoadingAttempt(true);
    setError(null);
    const response = await startPlacementSpeakingAttemptAction(sessionId);
    setLoadingAttempt(false);
    if (!response.ok) {
      setError(response.error);
      return;
    }
    setAttempt({
      attemptId: response.value.attemptId,
      level: response.value.level,
    });
    setLastPassedScore(response.value.lastPassedScore);
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    void startPlacementSpeakingAttemptAction(sessionId).then((response) => {
      if (cancelled) return;
      setLoadingAttempt(false);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setAttempt({
        attemptId: response.value.attemptId,
        level: response.value.level,
      });
      setLastPassedScore(response.value.lastPassedScore);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const handleComplete = useCallback(
    async (
      transcript: SpeakingTranscriptMessage[],
      diagnostics: RealtimeConversationDiagnostics,
    ) => {
      if (!attempt) return;
      setGrading(true);
      setError(null);
      const response = await gradePlacementSpeakingAction(
        sessionId,
        attempt.attemptId,
        transcript,
        diagnostics.learnerTurnConfidences,
      );
      if (!response.ok) {
        setGrading(false);
        setError(response.error);
        return;
      }

      setGrading(false);
      if (response.value.nextAttempt) {
        setLastPassedScore(response.value.evaluation.score);
        setAttempt({
          attemptId: response.value.nextAttempt.attemptId,
          level: response.value.nextAttempt.level,
        });
        return;
      }
      if (response.value.outcome) onFinished(response.value.outcome);
    },
    [attempt, onFinished, sessionId],
  );

  if (grading || loadingAttempt) {
    return (
      <Card className="flex min-h-80 flex-col items-center justify-center gap-3 text-center">
        <Loader2
          className="size-8 animate-spin text-primary-500"
          aria-hidden="true"
        />
        <SectionTitle>{messages.evaluating}</SectionTitle>
        <Body className="max-w-md text-text-secondary">
          {messages.evaluatingDescription}
        </Body>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <SectionTitle>
          {formatMessage(messages.title, {
            level: scenario.rolePlay.level ?? localizedTier(level),
          })}
        </SectionTitle>
        <Body className="text-text-secondary">{messages.instructions}</Body>
      </div>

      {lastPassedScore != null && (
        <InformationBanner variant="success">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {formatMessage(messages.previousBand, { score: lastPassedScore })}
          </span>
        </InformationBanner>
      )}
      {error && (
        <InformationBanner variant="error">
          {error} {messages.errorSuffix}
        </InformationBanner>
      )}

      <HanVoiceConversation
        key={attempt?.attemptId ?? level}
        disabled={!attempt}
        voice="marin"
        explanationLanguage="EN"
        mode="PRACTICE"
        usageSurface="PLACEMENT"
        context={{ ...context, speakingSurface: "PLACEMENT" }}
        open
        variant="immersive"
        roleLabel={scenario.rolePlay.aiRole}
        appendMessage={appendMessage}
        onActiveChange={handleActiveChange}
        onComplete={handleComplete}
        completionPolicy="objective"
        minimumLearnerTurns={PLACEMENT_SPEAKING_MIN_TURNS}
        maximumLearnerTurns={PLACEMENT_SPEAKING_MAX_TURNS}
        naturalCloseAfterMs={3 * 60 * 1000 + 45 * 1000}
        maxSessionMs={4 * 60 * 1000}
      />

      <Caption className="text-text-muted">
        {formatMessage(messages.evidenceNote, { level: localizedTier(7) })}
      </Caption>
      {error && (
        <div className="flex gap-2">
          {!attempt && (
            <Button type="button" variant="secondary" onClick={loadAttempt}>
              {messages.retry}
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setError(null)}
          >
            {messages.dismiss}
          </Button>
        </div>
      )}
    </div>
  );
}
