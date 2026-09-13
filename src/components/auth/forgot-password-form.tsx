"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  forgotPasswordAction,
  type ForgotPasswordFormState,
} from "@/lib/actions/forgot-password";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { PageTitle, Body } from "@/components/ui/typography";
import { localePath, type AppLocale } from "@/i18n/config";
import type { AuthMessages } from "@/i18n/messages/types";

const initialState: ForgotPasswordFormState = { status: "idle" };

export function ForgotPasswordForm({
  locale,
  messages,
}: {
  locale: AppLocale;
  messages: AuthMessages;
}) {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-4 text-center">
        <PageTitle>{messages.forgotPassword.successTitle}</PageTitle>
        <InformationBanner variant="success">{state.message}</InformationBanner>
        <Link
          href={localePath(locale, "/login")}
          className="font-interface text-supporting text-primary-300 hover:underline"
        >
          {messages.forgotPassword.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />
      <div className="flex flex-col gap-1 text-center">
        <PageTitle>{messages.forgotPassword.title}</PageTitle>
        <Body className="text-text-secondary">
          {messages.forgotPassword.description}
        </Body>
      </div>

      {state.status === "error" && state.message && (
        <InformationBanner variant="error">{state.message}</InformationBanner>
      )}

      <Input
        name="email"
        type="email"
        label={messages.forgotPassword.email}
        autoComplete="email"
        required
      />

      <Button type="submit" loading={isPending}>
        {messages.forgotPassword.submit}
      </Button>

      <Body className="text-center text-text-secondary">
        <Link
          href={localePath(locale, "/login")}
          className="text-primary-300 hover:underline"
        >
          {messages.forgotPassword.backToLogin}
        </Link>
      </Body>
    </form>
  );
}
