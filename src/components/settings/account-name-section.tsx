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
}: {
  nickname: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updateAccountNameAction,
    initialState,
  );

  if (nickname) {
    return (
      <div className="flex flex-col gap-1.5">
        <Caption className="font-medium text-text-primary">
          Account Name
        </Caption>
        <span className="font-interface text-body text-text-primary">
          @{nickname}
        </span>
        <Caption className="text-text-muted">
          Shown on the leaderboard. Permanent — it can&apos;t be changed.
        </Caption>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.status === "error" && (
        <InformationBanner variant="error">{state.message}</InformationBanner>
      )}
      <Input
        label="Account Name"
        name="nickname"
        placeholder="A unique handle for the leaderboard"
        hint="Letters, numbers, and underscores only. You can only set this once — choose carefully."
        maxLength={24}
      />
      <Button type="submit" loading={isPending} className="w-fit">
        Set Account Name
      </Button>
    </form>
  );
}
