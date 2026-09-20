"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  resetPasswordAction,
  type ResetPasswordFormState,
} from "@/lib/actions/reset-password";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { PageTitle, Body } from "@/components/ui/typography";
import { localePath, type AppLocale } from "@/i18n/config";
import type { AuthMessages } from "@/i18n/messages/types";

const initialState: ResetPasswordFormState = { status: "idle" };

export interface ResetPasswordFormProps {
  email: string;
  token: string;
  locale: AppLocale;
  messages: AuthMessages;
}

export function ResetPasswordForm({
  email,
  token,
  locale,
  messages,
}: ResetPasswordFormProps) {
  const boundAction = resetPasswordAction.bind(null, email, token);
  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState,
  );

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-4 text-center">
        <PageTitle>{messages.resetPassword.successTitle}</PageTitle>
        <InformationBanner variant="success">{state.message}</InformationBanner>
        <Link
          href={localePath(locale, "/login")}
          className="font-interface text-supporting text-primary-300 hover:underline"
        >
          {messages.resetPassword.goToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />
      <input
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-10000px] h-px w-px overflow-hidden"
      />
      <div className="flex flex-col gap-1 text-center">
        <PageTitle>{messages.resetPassword.title}</PageTitle>
      </div>

      {state.status === "error" && state.message && (
        <InformationBanner variant="error">{state.message}</InformationBanner>
      )}

      <Input
        name="password"
        type="password"
        label={messages.resetPassword.password}
        autoComplete="new-password"
        required
        hint={messages.resetPassword.passwordHint}
      />

      <Button type="submit" loading={isPending}>
        {messages.resetPassword.submit}
      </Button>
    </form>
  );
}
