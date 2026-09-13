"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { HanVoiceConversation } from "@/components/ai-teacher/han-voice-conversation";
import { InformationBanner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Body, Caption, SectionTitle } from "@/components/ui/typography";
import { gradePlacementSpeakingAction } from "@/lib/actions/placement-exam";
import { tierNameForLevel } from "@/lib/points-system";
import type { AiChatMessage } from "@/components/ai-teacher/ai-teacher-provider";
import {
  nextPlacementSpeakingLevel,
  PLACEMENT_SPEAKING_MAX_TURNS,
  PLACEMENT_SPEAKING_MIN_TURNS,
  PLACEMENT_SPEAKING_PASS_SCORE,
  PLACEMENT_SPEAKING_SCENARIOS,
  type PlacementSpeakingEvaluation,
  type PlacementSpeakingLevel,
} from "@/lib/placement-speaking";
import type { SpeakingTranscriptMessage } from "@/lib/reflection-prompt";
import type { RealtimeConversationDiagnostics } from "@/components/ai-teacher/han-voice-conversation";
import type { OnboardingMessages } from "@/i18n/messages/types";
import { formatMessage } from "@/i18n/format";

export interface PlacementSpeakingAttemptView {
  level: PlacementSpeakingLevel;
  transcript: SpeakingTranscriptMessage[];
  evaluation: PlacementSpeakingEvaluation;
}

export interface PlacementSpeakingOutcome {
  creditedLevel: number;
  diagnosticLevel: PlacementSpeakingLevel | null;
  attempts: PlacementSpeakingAttemptView[];
}

export function PlacementSpeakingExam({
  startingLevel,
  onFinished,
  messages,
  levelMessages,
}: {
  startingLevel: PlacementSpeakingLevel;
  onFinished: (outcome: PlacementSpeakingOutcome) => void;
  messages: OnboardingMessages["placementExam"]["speaking"];
  levelMessages: OnboardingMessages["placementExam"]["levels"];
}) {
  const [level, setLevel] = useState(startingLevel);
  const [attempts, setAttempts] = useState<PlacementSpeakingAttemptView[]>([]);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPassedScore, setLastPassedScore] = useState<number | null>(null);
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

  const handleComplete = useCallback(
    async (
      transcript: SpeakingTranscriptMessage[],
      diagnostics: RealtimeConversationDiagnostics,
    ) => {
      setGrading(true);
      setError(null);
      const response = await gradePlacementSpeakingAction(
        level,
        transcript,
        diagnostics.learnerTurnConfidences,
      );
      if (!response.ok) {
        setGrading(false);
        setError(response.error);
        return;
      }

      const attempt = { level, transcript, evaluation: response.value };
      const nextAttempts = [...attempts, attempt];
      setAttempts(nextAttempts);
      setGrading(false);

      if (response.value.score >= PLACEMENT_SPEAKING_PASS_SCORE) {
        const nextLevel = nextPlacementSpeakingLevel(level);
        if (nextLevel) {
          setLastPassedScore(response.value.score);
          setLevel(nextLevel);
          return;
        }
        onFinished({
          creditedLevel: 6,
          diagnosticLevel: 7,
          attempts: nextAttempts,
        });
        return;
      }

      onFinished({
        creditedLevel:
          level === startingLevel ? Math.max(0, startingLevel - 1) : level - 1,
        diagnosticLevel: level === 7 ? 7 : null,
        attempts: nextAttempts,
      });
    },
    [attempts, level, onFinished, startingLevel],
  );

  if (grading) {
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
        key={level}
        disabled={false}
        voice="marin"
        explanationLanguage="EN"
        mode="PRACTICE"
        context={context}
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
        <Button
          type="button"
          variant="secondary"
          onClick={() => setError(null)}
        >
          {messages.dismiss}
        </Button>
      )}
    </div>
  );
}
