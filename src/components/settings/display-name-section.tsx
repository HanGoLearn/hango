"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import {
  updateDisplayNameAction,
  type SettingsActionState,
} from "@/lib/actions/settings";
import type { AppLocale } from "@/i18n/config";
import type { SettingsMessages } from "@/i18n/messages/types";

const initialState: SettingsActionState = { status: "idle" };

/**
 * The name Han uses to address the learner (2026-08-29) - unlike
 * `AccountNameSection`, this is never locked; the user was explicit that
 * this one "sí se puede cambiar" (unlike the Account Name). Labeled plain
 * "Name" (not "Your name") since the old `User.name`/`ProfileSection`
 * field was removed the same day - the user flagged two "Name" fields in
 * Settings as a real, confusing duplication ("debe quedar solo uno"), and
 * `User.name` had no live reader anywhere in the app (only ever used once,
 * for the registration verification email) versus this field, which
 * Dashboard's greeting and Han both use - this was the one to keep.
 */
export function DisplayNameSection({
  initialDisplayName,
  locale,
  messages,
}: {
  initialDisplayName: string;
  locale: AppLocale;
  messages: SettingsMessages["displayName"];
}) {
  const [state, formAction, isPending] = useActionState(
    updateDisplayNameAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="locale" value={locale} />
      {state.status === "error" && (
        <InformationBanner variant="error">{state.message}</InformationBanner>
      )}
      <Input
        label={messages.label}
        name="displayName"
        defaultValue={initialDisplayName}
        placeholder={messages.placeholder}
        maxLength={60}
      />
      <Button type="submit" loading={isPending} className="w-fit">
        {messages.save}
      </Button>
    </form>
  );
}
