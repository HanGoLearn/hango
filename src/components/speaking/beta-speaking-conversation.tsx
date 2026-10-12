"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Body,
  Caption,
  ChineseText,
  Pinyin,
  Translation,
} from "@/components/ui/typography";
import { HanVoiceConversation } from "@/components/ai-teacher/han-voice-conversation";
import { useAiTeacher } from "@/components/ai-teacher/ai-teacher-provider";
import { speakingSessionTiming } from "@/lib/speaking-session-timing";
import type { BetaSpeakingConversationData } from "@/lib/beta-speaking-stations";
import type { SpeakingLabMessages } from "@/i18n/messages/types";

export function BetaSpeakingConversation({
  conversation,
  messages,
  onExit,
}: {
  conversation: BetaSpeakingConversationData;
  messages: SpeakingLabMessages;
  onExit: () => void;
}) {
  const { voice, explanationLanguage } = useAiTeacher();
  const [finished, setFinished] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [run, setRun] = useState(0);
  const finish = useCallback(() => setFinished(true), []);
  const markUnavailable = useCallback(() => setUnavailable(true), []);
  const ignoreMessage = useCallback(() => undefined, []);
  const ignoreActiveChange = useCallback(() => undefined, []);
  const copy = messages.beta.conversation;
  const timing = speakingSessionTiming(
    conversation.rolePlay.lessonHskLevel ?? null,
    "SPEAKING_LAB",
  );

  function restart() {
    setFinished(false);
    setUnavailable(false);
    setRun((value) => value + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <Body className="text-text-secondary">{copy.description}</Body>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Caption>{copy.character}</Caption>
            <Body>{conversation.rolePlay.aiRole}</Body>
          </div>
          <div>
            <Caption>{copy.yourRole}</Caption>
            <Body>{conversation.rolePlay.learnerRole}</Body>
          </div>
        </div>
        <div>
          <Caption>{copy.goal}</Caption>
          <Body>{conversation.rolePlay.objective}</Body>
        </div>
        <Caption>{copy.holdToTalk}</Caption>
        {conversation.helpPhrases.length > 0 && (
          <>
            <Button
              type="button"
              variant="tertiary"
              className="self-start"
              aria-expanded={showHelp}
              aria-controls="station-conversation-help"
              onClick={() => setShowHelp((value) => !value)}
            >
              {showHelp ? copy.hideHelp : copy.needHelp}
            </Button>
            {showHelp && (
              <div
                id="station-conversation-help"
                className="grid gap-3 sm:grid-cols-2"
              >
                {conversation.helpPhrases.map((phrase) => (
                  <div
                    key={phrase.chinese}
                    className="rounded-control border border-border p-3"
                  >
                    <ChineseText>{phrase.chinese}</ChineseText>
                    <Pinyin>{phrase.pinyin}</Pinyin>
                    <Translation>{phrase.english}</Translation>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>
      {!finished && !unavailable && (
        <HanVoiceConversation
          key={run}
          disabled={false}
          voice={voice}
          explanationLanguage={explanationLanguage}
          mode="PRACTICE"
          usageSurface="SPEAKING_LAB"
          // Lab turns have no lessonTitle/lessonId and never populate the Tutor
          // provider. They cannot invalidate Journey Reflection or complete a lesson.
          context={{
            speakingSurface: "SPEAKING_LAB",
            currentPageName: "Speaking Lab",
            rolePlay: conversation.rolePlay,
          }}
          open
          variant="immersive"
          roleLabel={conversation.rolePlay.aiRole}
          appendMessage={ignoreMessage}
          onActiveChange={ignoreActiveChange}
          onComplete={finish}
          onUnavailable={markUnavailable}
          completionPolicy="timer"
          naturalCloseAfterMs={timing.naturalCloseAfterMs}
          maxSessionMs={timing.maxSessionMs}
        />
      )}
      {(finished || unavailable) && (
        <Card className="flex flex-col gap-3" role="status">
          <Body>{finished ? copy.finished : copy.unavailable}</Body>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={restart}>
              {finished ? copy.tryAgain : copy.retry}
            </Button>
            <Button type="button" variant="secondary" onClick={onExit}>
              {messages.beta.backToStations}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
