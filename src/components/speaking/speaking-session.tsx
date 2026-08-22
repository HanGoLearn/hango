"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Volume2, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { CardTitle, Body, Caption } from "@/components/ui/typography";
import { AudioRecorder } from "@/components/speaking/audio-recorder";
import { CharacterToneFeedback } from "@/components/speaking/character-tone-feedback";
import { SpeakingFeedbackDisplay } from "@/components/speaking/speaking-feedback-display";
import type { SyllableScore } from "@/lib/tone-analysis";
import {
  submitRecordingAction,
  submitTextFallbackAction,
  completeSpeakingSessionAction,
  type SpeakingAttemptResult,
} from "@/lib/actions/speaking";
import { getDialogueAudioAction } from "@/lib/actions/dialogue-audio";

const ACTIVITY_TITLES: Record<string, string> = {
  SHADOWING: "Shadowing",
  SCENARIO_ROLE_PLAY: "Scenario Role Play",
};

export function SpeakingSession({
  sessionId,
  activityType,
  prompt,
  pinyin,
  dialogueId,
}: {
  sessionId: string;
  activityType: string;
  prompt: string;
  pinyin?: string;
  dialogueId?: string;
}) {
  const router = useRouter();
  const [result, setResult] = useState<SpeakingAttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [dialogueAudioUrl, setDialogueAudioUrl] = useState<string | null>(null);
  const [loadingDialogueAudio, setLoadingDialogueAudio] = useState(false);
  // Defaults to visible - Shadowing's long-text prompts are long enough that pinyin usually helps - but always toggleable (user feedback, 2026-08-08).
  const [showPinyin, setShowPinyin] = useState(true);
  const [syllableScores, setSyllableScores] = useState<SyllableScore[] | null>(null);

  async function handlePlayDialogueAudio() {
    if (!dialogueId) return;
    setLoadingDialogueAudio(true);
    const audioResult = await getDialogueAudioAction(dialogueId);
    setLoadingDialogueAudio(false);
    if (audioResult.ok) setDialogueAudioUrl(audioResult.url);
  }

  async function handleSubmitRecording(formData: FormData) {
    const attemptResult = await submitRecordingAction(sessionId, formData);
    if (attemptResult.ok) {
      setError(null);
      setResult(attemptResult.result);
    } else {
      setError(attemptResult.error);
    }
  }

  async function handleSubmitText(text: string) {
    const attemptResult = await submitTextFallbackAction(sessionId, text);
    if (attemptResult.ok) {
      setError(null);
      setResult(attemptResult.result);
    } else {
      setError(attemptResult.error);
    }
  }

  async function handleFinish() {
    setFinishing(true);
    await completeSpeakingSessionAction(sessionId);
    router.push("/speaking-lab");
  }

  function handleTryAgain() {
    setResult(null);
    setSyllableScores(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{ACTIVITY_TITLES[activityType] ?? activityType}</CardTitle>
          {pinyin && (
            <Button
              type="button"
              variant="tertiary"
              className="gap-1.5 px-0"
              onClick={() => setShowPinyin((value) => !value)}
            >
              {showPinyin ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
              {showPinyin ? "Hide pinyin" : "Show pinyin"}
            </Button>
          )}
        </div>
        <Body className="text-text-secondary">
          {activityType === "SHADOWING"
            ? "Say the following out loud:"
            : "Respond out loud in Chinese:"}
        </Body>
        {pinyin ? (
          <CharacterToneFeedback
            text={prompt}
            pinyin={pinyin}
            syllableScores={syllableScores}
            showPinyin={showPinyin}
          />
        ) : (
          <Body className="font-chinese text-chinese-body">{prompt}</Body>
        )}
        {activityType === "SHADOWING" && (
          <Caption className="text-text-secondary">
            Characters turn green or red once you finish recording.
          </Caption>
        )}
        {dialogueId && (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="tertiary"
              className="w-fit gap-1.5 px-0"
              onClick={() => void handlePlayDialogueAudio()}
              loading={loadingDialogueAudio}
            >
              <Volume2 className="size-4" aria-hidden="true" />
              Listen to native audio
            </Button>
            {dialogueAudioUrl && (
              <audio controls src={dialogueAudioUrl} className="h-10">
                <track kind="captions" />
              </audio>
            )}
          </div>
        )}
      </Card>

      {error && (
        <InformationBanner variant="error">
          <Body>{error}</Body>
        </InformationBanner>
      )}

      {!result ? (
        <AudioRecorder
          onSubmitRecording={handleSubmitRecording}
          onSubmitText={handleSubmitText}
          expectedPinyin={pinyin}
          onToneAnalysis={(analysis) => setSyllableScores(analysis.perSyllable)}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <SpeakingFeedbackDisplay
            transcript={result.transcript}
            feedback={result.feedback}
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={handleTryAgain}>
              Try again
            </Button>
            <Button
              type="button"
              onClick={() => void handleFinish()}
              loading={finishing}
            >
              Finish
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
