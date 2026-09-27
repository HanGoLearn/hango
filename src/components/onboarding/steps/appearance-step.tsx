"use client";

import { RadioGroup } from "@/components/ui/radio-group";
import { RadioTile } from "@/components/onboarding/option-tile";
import { Button } from "@/components/ui/button";
import { SectionTitle, Body } from "@/components/ui/typography";
import { HanMascot } from "@/components/ui/han-mascot";
import {
  setThemePreference,
  useThemePreference,
} from "@/components/shell/theme-store";
import { isThemePreference } from "@/lib/theme";
import type { OnboardingMessages } from "@/i18n/messages/types";

/**
 * Appearance asked once, here (2026-09-20, user decision). The theme
 * control used to sit permanently in the top bar of every screen; it is a
 * set-once preference, not something a learner adjusts mid-lesson, so it
 * moved to this step and to Settings.
 *
 * No server action and no `onNext` payload: the choice is a cookie written
 * through the shared theme store, applied the instant it's picked, so the
 * learner sees the result behind this step rather than after finishing
 * onboarding. Nothing to persist server-side means nothing for
 * `resolveResumeStep` to check either - a learner who resumes past this
 * point keeps whatever they already chose.
 */
export interface AppearanceStepProps {
  onNext: () => void;
  onBack: () => void;
  messages: OnboardingMessages["appearance"];
  commonMessages: OnboardingMessages["common"];
}

export function AppearanceStep({
  onNext,
  onBack,
  messages,
  commonMessages,
}: AppearanceStepProps) {
  const theme = useThemePreference();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <HanMascot pose="curious" size={110} />
        <SectionTitle>{messages.title}</SectionTitle>
        <Body className="text-text-secondary">{messages.description}</Body>
      </div>

      <RadioGroup
        value={theme}
        onValueChange={(next) => {
          if (isThemePreference(next)) setThemePreference(next);
        }}
        className="grid grid-cols-3 gap-3"
      >
        <RadioTile value="light" label={messages.light} />
        <RadioTile value="dark" label={messages.dark} />
        <RadioTile value="system" label={messages.system} />
      </RadioGroup>

      <div className="flex justify-between gap-3">
        <Button variant="tertiary" onClick={onBack} type="button">
          {commonMessages.back}
        </Button>
        <Button size="lg" onClick={onNext}>
          {commonMessages.continue}
        </Button>
      </div>
    </div>
  );
}
