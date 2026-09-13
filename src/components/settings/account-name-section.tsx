"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { Caption } from "@/components/ui/typography";
import {
  updateAccountNameAction,
  type SettingsActionState,
} from "@/lib/actions/settings";
import type { AppLocale } from "@/i18n/config";
import type { SettingsMessages } from "@/i18n/messages/types";

const initialState: SettingsActionState = { status: "idle" };

/**
 * The leaderboard handle - settable exactly once, then permanent for the
 * life of the account (2026-08-29, user's own rule: "ya no se puede
 * cambiar y se va a mantener así por el resto de la vida de la cuenta").
 * Read-only display once set (this component's whole reason to exist
 * separately from `DisplayNameSection` - one is locked, one never is);
 * the one-time input only for accounts that finished onboarding before
 * this field existed and have never set it.
 */
export function AccountNameSection({
  nickname,
  locale,
  messages,
}: {
  nickname: string | null;
  locale: AppLocale;
  messages: SettingsMessages["accountName"];
}) {
  const [state, formAction, isPending] = useActionState(
    updateAccountNameAction,
    initialState,
  );

  if (nickname) {
    return (
      <div className="flex flex-col gap-1.5">
        <Caption className="font-medium text-text-primary">
          {messages.label}
        </Caption>
        <span className="font-interface text-body text-text-primary">
          @{nickname}
        </span>
        <Caption className="text-text-muted">{messages.permanent}</Caption>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="locale" value={locale} />
      {state.status === "error" && (
        <InformationBanner variant="error">{state.message}</InformationBanner>
      )}
      <Input
        label={messages.label}
        name="nickname"
        placeholder={messages.placeholder}
        hint={messages.hint}
        maxLength={24}
      />
      <Button type="submit" loading={isPending} className="w-fit">
        {messages.set}
      </Button>
    </form>
  );
}
