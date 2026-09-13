"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginFormState } from "@/lib/actions/login";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { PageTitle, Body } from "@/components/ui/typography";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { localePath, type AppLocale } from "@/i18n/config";
import type { AuthMessages } from "@/i18n/messages/types";

const initialState: LoginFormState = { status: "idle" };

export interface LoginFormProps {
  /** Success notice from a redirect, e.g. after email verification. */
  notice?: string;
  /** Error notice from a redirect, e.g. an invalid/expired verification link or OAuth failure. */
  errorNotice?: string;
  googleEnabled: boolean;
  /** Where to send the learner after a successful login (e.g. the page that redirected them here). */
  redirectTo?: string;
  locale: AppLocale;
  messages: AuthMessages;
}

export function LoginForm({
  notice,
  errorNotice,
  googleEnabled,
  redirectTo = "/dashboard",
  locale,
  messages,
}: LoginFormProps) {
  const boundLoginAction = loginAction.bind(null, redirectTo);
  const [state, formAction, isPending] = useActionState(
    boundLoginAction,
    initialState,
  );

  return (
    // Two sibling <form> elements, not nested — GoogleSignInButton renders
    // its own <form> for its Server Action, and HTML forbids nested forms
    // (the browser would silently drop the inner one and submit this form
    // instead, which is why the Google button did nothing).
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <PageTitle>{messages.login.title}</PageTitle>
        <Body className="text-text-secondary">{messages.login.subtitle}</Body>
      </div>

      {notice && (
        <InformationBanner variant="success">{notice}</InformationBanner>
      )}

      {errorNotice && (
        <InformationBanner variant="error">{errorNotice}</InformationBanner>
      )}

      {state.status === "error" && state.message && (
        <InformationBanner variant="error">{state.message}</InformationBanner>
      )}

      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="locale" value={locale} />
        <Input
          name="email"
          type="email"
          label={messages.login.email}
          autoComplete="email"
          required
        />
        <Input
          name="password"
          type="password"
          label={messages.login.password}
          autoComplete="current-password"
          required
        />

        <Link
          href={localePath(locale, "/forgot-password")}
          className="text-right font-interface text-supporting text-primary-300 hover:underline"
        >
          {messages.login.forgotPassword}
        </Link>

        <Button type="submit" loading={isPending}>
          {messages.login.submit}
        </Button>
      </form>

      <GoogleSignInButton
        enabled={googleEnabled}
        redirectTo={redirectTo}
        messages={messages.google}
      />

      <Body className="text-center text-text-secondary">
        {messages.login.noAccount}{" "}
        <Link
          href={localePath(locale, "/register")}
          className="text-primary-300 hover:underline"
        >
          {messages.login.register}
        </Link>
      </Body>
    </div>
  );
}
