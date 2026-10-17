"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, CircleHelp, Keyboard, X } from "lucide-react";
import {
  SectionTitle,
  Body,
  Caption,
  ChineseText,
  Pinyin,
  Translation,
} from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { AiTeacherChat } from "@/components/ai-teacher/ai-teacher-chat";
import { HanVoiceConversation } from "@/components/ai-teacher/han-voice-conversation";
import type { RealtimeConversationDiagnostics } from "@/components/ai-teacher/han-voice-conversation";
import {
  startJourneySpeakingAttemptAction,
  sealJourneySpeakingAttemptAction,
} from "@/lib/actions/journey-speaking";
import { buildJourneyAttemptCapture } from "@/lib/journey-speaking-capture";
import type { JourneyAttemptSealInput } from "@/lib/journey-speaking-attempt-contract";
import type { AppLocale } from "@/i18n/config";
import { journeyReportMessages } from "@/i18n/journey-report";
import { useAiTeacher } from "@/components/ai-teacher/ai-teacher-provider";
import { StepContinueButton } from "@/components/lesson/step-continue-button";
import type { SpeakingTranscriptMessage } from "@/lib/reflection-prompt";
import type { LessonWithContent } from "@/lib/content/lesson-data";
import {
  buildSpeakingHelp,
  type SpeakingHelpPhrase,
} from "@/lib/speaking-help";
import { speakingSessionTiming } from "@/lib/speaking-session-timing";
import { useLessonMessages } from "@/components/lesson/lesson-messages";
import { formatMessage } from "@/i18n/format";

const CHINESE_ROLE_LABELS: Record<string, string> = {
  waiter: "服务员",
  "front desk staff": "前台",
  receptionist: "前台",
  salesperson: "店员",
  clerk: "店员",
  customer: "顾客",
  guest: "客人",
};

function bilingualRoleLabel(role: string): string {
  const chinese = CHINESE_ROLE_LABELS[role.toLowerCase()];
  return chinese ? `${chinese} · ${role}` : role;
}

export function SpeakingStep({
  lessonId,
  mission,
  vocabulary,
  grammar,
  dialogues,
  hskReference,
  onContinue,
  testMode = false,
  evidenceCapture = false,
  locale = "en",
}: {
  lessonId: string;
  mission: LessonWithContent["mission"];
  vocabulary: LessonWithContent["vocabulary"];
  grammar: LessonWithContent["grammar"];
  dialogues: LessonWithContent["dialogues"];
  hskReference: number | null;
  onContinue: (response?: { journeySpeakingAttemptId: string }) => void;
  /** Local QA only: exercises the real Speaking UI without retaining the transcript. */
  testMode?: boolean;
  /** Remains off during staged rollout until Reflection/rewards integration. */
  evidenceCapture?: boolean;
  locale?: AppLocale;
}) {
  const messages = useLessonMessages();
  const captureEnabled = evidenceCapture && !testMode;
  const attemptIdRef = useRef<string | null>(null);
  const requestKeyRef = useRef<string | null>(null);
  const fallbackSavingRef = useRef(false);
  const sealedCaptureRef = useRef<JourneyAttemptSealInput | null>(null);
  const [captureState, setCaptureState] = useState<
    "idle" | "saving" | "saved" | "failed"
  >("idle");
  const saveCapture = useCallback(async () => {
    if (!sealedCaptureRef.current) return false;
    setCaptureState("saving");
    try {
      const result = await sealJourneySpeakingAttemptAction(
        sealedCaptureRef.current,
      );
      setCaptureState(result.ok ? "saved" : "failed");
      return result.ok;
    } catch {
      setCaptureState("failed");
      return false;
    }
  }, []);
  const prepareAttempt = useCallback(async () => {
    requestKeyRef.current ??= crypto.randomUUID();
    const result = await startJourneySpeakingAttemptAction({
      lessonId,
      locale,
      requestKey: requestKeyRef.current,
    });
    if (!result.ok) throw new Error(messages.speaking.captureUnavailable);
    attemptIdRef.current = result.attemptId;
    return result;
  }, [lessonId, locale, messages.speaking.captureUnavailable]);
  async function continueWithoutVoice() {
    if (fallbackSavingRef.current) return;
    fallbackSavingRef.current = true;
    setCaptureState("saving");
    try {
      if (!attemptIdRef.current) await prepareAttempt();
      sealedCaptureRef.current ??= {
        attemptId: attemptIdRef.current!,
        lessonId,
        closeReason: "TECHNICAL_FAILURE",
        turns: [],
      };
      if (await saveCapture())
        onContinue({ journeySpeakingAttemptId: attemptIdRef.current! });
    } catch {
      setCaptureState("failed");
    } finally {
      fallbackSavingRef.current = false;
    }
  }
  const handleAbandon = useCallback(
    (
      transcript: SpeakingTranscriptMessage[],
      diagnostics: RealtimeConversationDiagnostics,
    ) => {
      if (!attemptIdRef.current) return;
      const capture = buildJourneyAttemptCapture(
        attemptIdRef.current,
        lessonId,
        transcript,
        diagnostics,
      );
      void sealJourneySpeakingAttemptAction(capture).catch(() => undefined);
    },
    [lessonId],
  );
  const {
    setMode,
    setContext,
    context,
    voice,
    explanationLanguage,
    appendRealtimeMessage,
  } = useAiTeacher();
  const [fallbackVisible, setFallbackVisible] = useState(!mission);
  const [finishedTranscript, setFinishedTranscript] = useState<
    SpeakingTranscriptMessage[] | null
  >(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const handleActiveChange = useCallback(() => undefined, []);
  const discardRealtimeMessage = useCallback(() => undefined, []);
  const handleUnavailable = useCallback(() => setFallbackVisible(true), []);
  const handleComplete = useCallback(
    async (
      transcript: SpeakingTranscriptMessage[],
      diagnostics: RealtimeConversationDiagnostics,
    ) => {
      setFinishedTranscript(transcript);
      if (captureEnabled && attemptIdRef.current) {
        sealedCaptureRef.current = buildJourneyAttemptCapture(
          attemptIdRef.current,
          lessonId,
          transcript,
          diagnostics,
        );
        await saveCapture();
      }
    },
    [captureEnabled, lessonId, saveCapture],
  );
  const rolePlay = useMemo(
    () =>
      mission
        ? {
            aiRole: mission.aiRole ?? "conversation partner",
            learnerRole: mission.learnerRole ?? "customer",
            scenarioContext: mission.context ?? "",
            objective: mission.objective,
            lessonVocabulary: vocabulary.map(
              (item) => item.vocabularyItem.chineseForm,
            ),
            lessonGrammar: grammar.map((item) => item.grammarPoint.structure),
            lessonPhrases: dialogues.flatMap((dialogue) =>
              dialogue.lines.map((line) => line.chineseText),
            ),
            lessonHskLevel: hskReference ?? undefined,
          }
        : undefined,
    [dialogues, grammar, hskReference, mission, vocabulary],
  );
  const sessionTiming = speakingSessionTiming(hskReference);
  const help = useMemo(
    () =>
      buildSpeakingHelp({
        learnerRole: mission?.learnerRole ?? "customer",
        vocabulary: vocabulary.map(({ vocabularyItem }) => ({
          chineseForm: vocabularyItem.chineseForm,
          pinyin: vocabularyItem.pinyin,
          meaning: vocabularyItem.meaning,
        })),
        grammar: grammar.map(({ grammarPoint }) => ({
          name: grammarPoint.name,
          structure: grammarPoint.structure,
          communicationPurpose: grammarPoint.communicationPurpose,
          examples: grammarPoint.examples,
        })),
        dialogues,
      }),
    [dialogues, grammar, mission?.learnerRole, vocabulary],
  );

  useEffect(() => {
    if (captureEnabled) return;
    setMode("PRACTICE");
    if (rolePlay) setContext({ rolePlay });
  }, [rolePlay, setContext, setMode, captureEnabled]);

  const sessionContext = { ...context, rolePlay };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <SectionTitle>{messages.speaking.title}</SectionTitle>
        <Body className="text-text-secondary">
          {messages.speaking.description}
        </Body>
      </div>

      {!fallbackVisible && mission && rolePlay && !finishedTranscript && (
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="tertiary"
            className="self-end"
            aria-expanded={helpVisible}
            aria-controls="speaking-conversation-help"
            onClick={() => setHelpVisible((visible) => !visible)}
          >
            {helpVisible ? (
              <X className="size-4" aria-hidden="true" />
            ) : (
              <CircleHelp className="size-4" aria-hidden="true" />
            )}
            {helpVisible
              ? messages.speaking.hideHelp
              : messages.speaking.needHelp}
          </Button>

          <div
            className={
              helpVisible
                ? "grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]"
                : "grid"
            }
          >
            <HanVoiceConversation
              disabled={false}
              voice={voice}
              explanationLanguage={
                captureEnabled
                  ? locale === "es"
                    ? "Spanish"
                    : "English"
                  : explanationLanguage
              }
              mode="PRACTICE"
              usageSurface="JOURNEY"
              context={{
                ...sessionContext,
                lessonId,
                speakingSurface: "JOURNEY",
              }}
              open
              variant="immersive"
              roleLabel={bilingualRoleLabel(rolePlay.aiRole)}
              appendMessage={
                testMode ? discardRealtimeMessage : appendRealtimeMessage
              }
              onActiveChange={handleActiveChange}
              onUnavailable={handleUnavailable}
              onComplete={handleComplete}
              prepareJourneyAttempt={
                captureEnabled ? prepareAttempt : undefined
              }
              onJourneyAbandon={captureEnabled ? handleAbandon : undefined}
              saveConversationHistory={!testMode}
              // Objective completion is recorded for Reflection but never
              // closes Speaking. The timer owns the natural ending.
              naturalCloseAfterMs={sessionTiming.naturalCloseAfterMs}
              maxSessionMs={sessionTiming.maxSessionMs}
            />

            {helpVisible && (
              // Was border-primary-200/bg-primary-50/text-primary-900 -
              // literal light-pastel steps that don't change per theme, so
              // this rendered as a fixed bright-pink card even in dark mode
              // (a visible bug, not just a token-consistency nitpick). Now
              // uses the same surface/border/text-* aliases every other
              // lesson panel uses, so it actually inverts with the theme.
              <aside
                id="speaking-conversation-help"
                className="flex max-h-[40rem] flex-col gap-5 overflow-y-auto rounded-panel border border-border bg-surface p-5 text-left"
                aria-label={messages.speaking.helpLabel}
              >
                <div className="flex items-center gap-2 text-text-primary">
                  <CircleHelp className="size-5" aria-hidden="true" />
                  <h3 className="font-display text-lg font-semibold">
                    {messages.speaking.helpLabel}
                  </h3>
                </div>

                <div className="flex flex-col gap-2">
                  <Caption className="font-semibold uppercase tracking-wide text-text-muted">
                    {messages.speaking.yourGoal}
                  </Caption>
                  <Body className="font-semibold text-text-primary">
                    {mission.objective}
                  </Body>
                </div>

                <HelpPhraseSection
                  title={messages.speaking.questions}
                  phrases={help.questions}
                />
                <HelpPhraseSection
                  title={messages.speaking.usefulPhrases}
                  phrases={help.thingsToSay}
                />

                {help.grammar.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <Caption className="font-semibold uppercase tracking-wide text-text-muted">
                      {messages.speaking.grammar}
                    </Caption>
                    {help.grammar.map((item) => (
                      <div
                        key={item.name}
                        className="rounded-control border border-border bg-elevated p-3"
                      >
                        <Body className="font-semibold text-text-primary">
                          {item.name}
                        </Body>
                        {/* text-accent-300, matching GrammarPointCard's
                            structure chip (grammar-step.tsx) - the one
                            accent step re-tuned per theme specifically for
                            direct-text use (accent-700 measured 2.72:1 on
                            dark elevated, well under AA). */}
                        <Caption className="mt-1 block font-mono text-accent-300">
                          {item.structure}
                        </Caption>
                        {item.purpose && (
                          <Translation className="mt-1">
                            {item.purpose}
                          </Translation>
                        )}
                        {item.example && (
                          <HelpPhrase phrase={item.example} compact />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {help.vocabulary.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <Caption className="font-semibold uppercase tracking-wide text-text-muted">
                      {messages.speaking.vocabulary}
                    </Caption>
                    <div className="grid grid-cols-2 gap-2">
                      {help.vocabulary.map((item) => (
                        <div
                          key={`${item.chineseForm}-${item.pinyin}`}
                          className="rounded-control bg-elevated p-2.5"
                        >
                          <ChineseText className="text-[1.05rem]">
                            {item.chineseForm}
                          </ChineseText>
                          <Pinyin>{item.pinyin}</Pinyin>
                          <Translation>{item.meaning}</Translation>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Caption className="mt-auto text-text-secondary">
                  {messages.speaking.helpTip}
                </Caption>
              </aside>
            )}
          </div>
        </div>
      )}

      {finishedTranscript && (
        <div
          className={`flex flex-col items-start gap-3 rounded-panel border p-5 ${captureEnabled && captureState === "failed" ? "border-error-500/40 bg-error-500/10" : "border-success-500/40 bg-success-500/10"}`}
        >
          {/* text-success-500, not the fixed success-50 this used before
              (2026-08-21) - success-50 is a near-white fixed shade, fine at
              14.85:1 against the wash's dark-theme composite but only
              1.13:1 (nearly invisible) against its light-theme composite.
              success-500 matches the mid-tone-on-own-wash pattern
              reflection-step.tsx's error panel already uses. */}
          <div
            className={`flex items-center gap-2 ${captureEnabled && captureState === "failed" ? "text-error-500" : "text-success-500"}`}
          >
            {captureEnabled && captureState === "failed" ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-5" aria-hidden="true" />
            )}
            <Body
              className={
                captureEnabled && captureState === "failed"
                  ? "font-semibold text-error-500"
                  : "font-semibold text-success-500"
              }
            >
              {testMode
                ? messages.speaking.testFinished
                : captureEnabled && captureState === "saving"
                  ? messages.speaking.captureSaving
                  : captureEnabled && captureState === "failed"
                    ? messages.speaking.captureFailed
                    : messages.speaking.saved}
            </Body>
          </div>
          <Caption>
            {testMode
              ? formatMessage(messages.speaking.testTurns, {
                  count: finishedTranscript.length,
                })
              : formatMessage(messages.speaking.reflectionTurns, {
                  count: finishedTranscript.length,
                })}
          </Caption>
          {captureEnabled && captureState === "failed" && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void saveCapture()}
            >
              {messages.speaking.retrySave}
            </Button>
          )}
          <StepContinueButton
            disabled={captureEnabled && captureState !== "saved"}
            onClick={() =>
              onContinue(
                captureEnabled && attemptIdRef.current
                  ? { journeySpeakingAttemptId: attemptIdRef.current }
                  : undefined,
              )
            }
            label={
              testMode
                ? messages.speaking.testNextLesson
                : messages.common.continue
            }
          />
        </div>
      )}

      {fallbackVisible && !finishedTranscript && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Keyboard
              className="size-4 text-text-secondary"
              aria-hidden="true"
            />
            <Body className="text-text-secondary">
              {captureEnabled
                ? messages.speaking.captureUnavailable
                : messages.speaking.microphoneUnavailable}
            </Body>
          </div>
          {!captureEnabled && (
            <div className="h-[28rem] rounded-card border border-border bg-surface p-4">
              <AiTeacherChat voiceEnabled={false} />
            </div>
          )}
          <StepContinueButton
            disabled={captureEnabled && captureState === "saving"}
            onClick={() =>
              captureEnabled ? void continueWithoutVoice() : onContinue()
            }
            label={
              testMode
                ? messages.speaking.testNextLesson
                : captureEnabled
                  ? journeyReportMessages[locale].continueWithoutVoice
                  : messages.common.continue
            }
          />
          {captureEnabled && captureState === "failed" && (
            <Body role="alert" className="text-error-500">
              {messages.speaking.captureFailed}
            </Body>
          )}
        </div>
      )}

      {!captureEnabled && !fallbackVisible && !finishedTranscript && (
        <Button
          type="button"
          variant="tertiary"
          className="self-start"
          onClick={() => setFallbackVisible(true)}
        >
          {messages.speaking.useText}
        </Button>
      )}
    </div>
  );
}

function HelpPhrase({
  phrase,
  compact = false,
}: {
  phrase: SpeakingHelpPhrase;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "mt-2 border-t border-border pt-2"
          : "rounded-control border border-border bg-elevated p-3"
      }
    >
      <ChineseText className="text-[1.05rem]">{phrase.chinese}</ChineseText>
      <Pinyin>{phrase.pinyin}</Pinyin>
      <Translation>{phrase.english}</Translation>
    </div>
  );
}

function HelpPhraseSection({
  title,
  phrases,
}: {
  title: string;
  phrases: SpeakingHelpPhrase[];
}) {
  if (phrases.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <Caption className="font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </Caption>
      {phrases.map((phrase) => (
        <HelpPhrase key={phrase.chinese} phrase={phrase} />
      ))}
    </div>
  );
}
