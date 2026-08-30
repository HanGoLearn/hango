import { MessageCircleQuestion, Mic, Flame } from "lucide-react";
import { PageTitle, Body, CardTitle, Caption } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { HanMascot } from "@/components/ui/han-mascot";

/**
 * Real HanGo capabilities Han actually has (not aspirational copy) - text
 * explanations (ai-teacher-chat.tsx), live voice conversation
 * (han-voice-conversation.tsx / han-realtime.ts), and the real streak
 * system (study-streak.ts). Structure (mascot + name + 3-feature list +
 * CTA) takes a cue from a reference app the user liked, per 2026-08-27's
 * "principios, no copia" rule - none of that app's copy, colors, or mascot
 * carry over.
 */
const HAN_FEATURES = [
  {
    icon: MessageCircleQuestion,
    title: "Explains as you go",
    description: "Ask Han anything, anytime — text or voice.",
  },
  {
    icon: Mic,
    title: "Talks with you",
    description: "Practice real conversations out loud, not just typing.",
  },
  {
    icon: Flame,
    title: "Keeps your streak alive",
    description: "A nudge before you lose it.",
  },
];

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <HanMascot pose="wave" size={140} gesture="wave" />
      <div>
        <PageTitle>Meet Han</PageTitle>
        <Body className="mt-1 text-text-secondary">
          Your teacher for this whole journey. A few quick questions
          first, so lessons can be tailored to you.
        </Body>
      </div>

      <div className="flex w-full flex-col gap-2 text-left">
        {HAN_FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex items-center gap-3 rounded-panel bg-elevated p-3"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-500/10 text-primary-500">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-body">{title}</CardTitle>
              <Caption className="text-text-secondary">{description}</Caption>
            </div>
          </div>
        ))}
      </div>

      <Button size="lg" onClick={onNext} className="mt-2 w-full">
        Get started
      </Button>
    </div>
  );
}
