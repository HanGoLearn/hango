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
  submitTextFallbackAction,
  completeSpeakingSessionAction,
  type SpeakingAttemptResult,
} from "@/lib/actions/speaking";
import { submitSpeakingRecording } from "@/lib/speaking-upload-client";
import { getDialogueAudioAction } from "@/lib/actions/dialogue-audio";
import { localePath, type AppLocale } from "@/i18n/config";
import type { SpeakingLabMessages } from "@/i18n/messages/types";
import { localizeSpeakingError } from "@/i18n/speaking";

export function SpeakingSession({
  locale,
  sessionId,
  activityType,
  prompt,
  pinyin,
  dialogueId,
  messages,
}: {
  locale: AppLocale;
  sessionId: string;
  activityType: string;
  prompt: string;
  pinyin?: string;
  dialogueId?: string;
  messages: SpeakingLabMessages;
}) {
  const router = useRouter();
  const [result, setResult] = useState<SpeakingAttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [dialogueAudioUrl, setDialogueAudioUrl] = useState<string | null>(null);
  const [loadingDialogueAudio, setLoadingDialogueAudio] = useState(false);
  // Defaults to visible - Shadowing's long-text prompts are long enough that pinyin usually helps - but always toggleable (user feedback, 2026-08-08).
  const [showPinyin, setShowPinyin] = useState(true);
  const [syllableScores, setSyllableScores] = useState<SyllableScore[] | null>(
    null,
  );

  async function handlePlayDialogueAudio() {
    if (!dialogueId) return;
    setLoadingDialogueAudio(true);
    const audioResult = await getDialogueAudioAction(dialogueId);
    setLoadingDialogueAudio(false);
    if (audioResult.ok) setDialogueAudioUrl(audioResult.url);
  }

  async function handleSubmitRecording(formData: FormData) {
    const attemptResult = await submitSpeakingRecording(sessionId, formData);
    if (attemptResult.ok) {
      setError(null);
      setResult(attemptResult.result);
      return true;
    } else {
      setError(localizeSpeakingError(attemptResult.error, messages.errors));
      return false;
    }
  }

  async function handleSubmitText(text: string) {
    const attemptResult = await submitTextFallbackAction(sessionId, text);
    if (attemptResult.ok) {
      setError(null);
      setResult(attemptResult.result);
      return true;
    } else {
      setError(localizeSpeakingError(attemptResult.error, messages.errors));
      return false;
    }
  }

  async function handleFinish() {
    setFinishing(true);
    await completeSpeakingSessionAction(sessionId);
    router.push(localePath(locale, "/speaking-lab"));
  }

  function handleTryAgain() {
    setResult(null);
    setSyllableScores(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle>
            {messages.session.activityTitles[
              activityType as keyof typeof messages.session.activityTitles
            ] ?? activityType}
          </CardTitle>
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
              {showPinyin
                ? messages.common.hidePinyin
                : messages.common.showPinyin}
            </Button>
          )}
        </div>
        <Body className="text-text-secondary">
          {activityType === "SHADOWING"
            ? messages.session.sayOutLoud
            : messages.session.respondOutLoud}
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
            {messages.session.colorFeedback}
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
              {messages.session.listenNative}
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
          messages={messages.recorder}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <SpeakingFeedbackDisplay
            transcript={result.transcript}
            feedback={result.feedback}
            messages={messages.feedback}
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={handleTryAgain}>
              {messages.common.tryAgain}
            </Button>
            <Button
              type="button"
              onClick={() => void handleFinish()}
              loading={finishing}
            >
              {messages.common.finish}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
