"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction, type RegisterFormState } from "@/lib/actions/register";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { PageTitle, Body } from "@/components/ui/typography";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { localePath, type AppLocale } from "@/i18n/config";
import type { AuthMessages } from "@/i18n/messages/types";

const initialState: RegisterFormState = { status: "idle" };

export interface RegisterFormProps {
  googleEnabled: boolean;
  inviteOnly: boolean;
  locale: AppLocale;
  messages: AuthMessages;
}

export function RegisterForm({
  googleEnabled,
  inviteOnly,
  locale,
  messages,
}: RegisterFormProps) {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState,
  );
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-4 text-center">
        <PageTitle>{messages.register.successTitle}</PageTitle>
        <InformationBanner variant="success">{state.message}</InformationBanner>
        <Link
          href={localePath(locale, "/login")}
          className="font-interface text-supporting text-primary-300 hover:underline"
        >
          {messages.register.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    // Two sibling <form> elements, not nested — see login-form.tsx for why.
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <PageTitle>{messages.register.title}</PageTitle>
        <Body className="text-text-secondary">
          {messages.register.subtitle}
        </Body>
      </div>

      {state.status === "error" && state.message && (
        <InformationBanner variant="error">{state.message}</InformationBanner>
      )}

      {inviteOnly && (
        <InformationBanner variant="info">
          {messages.register.betaNotice}
        </InformationBanner>
      )}

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
        <Input
          name="name"
          label={messages.register.name}
          autoComplete="name"
          required
          error={state.fieldErrors?.name}
        />
        <Input
          name="email"
          type="email"
          label={messages.register.email}
          autoComplete="email"
          required
          error={state.fieldErrors?.email}
        />
        <Input
          name="password"
          type="password"
          label={messages.register.password}
          autoComplete="new-password"
          required
          error={state.fieldErrors?.password}
          hint={messages.register.passwordHint}
        />

        <Checkbox
          label={messages.register.terms}
          checked={termsAccepted}
          onCheckedChange={(checked) => setTermsAccepted(checked === true)}
        />

        <Button
          type="submit"
          loading={isPending}
          disabled={!termsAccepted || isPending}
        >
          {messages.register.submit}
        </Button>
      </form>

      <GoogleSignInButton
        enabled={googleEnabled}
        redirectTo={localePath(locale, "/dashboard")}
        messages={messages.google}
      />

      <Body className="text-center text-text-secondary">
        {messages.register.existingAccount}{" "}
        <Link
          href={localePath(locale, "/login")}
          className="text-primary-300 hover:underline"
        >
          {messages.register.login}
        </Link>
      </Body>
    </div>
  );
}
