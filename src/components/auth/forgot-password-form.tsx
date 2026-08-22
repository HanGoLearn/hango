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

const initialState: ForgotPasswordFormState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-4 text-center">
        <PageTitle>Check your email</PageTitle>
        <InformationBanner variant="success">{state.message}</InformationBanner>
        <Link
          href="/login"
          className="font-interface text-supporting text-primary-300 hover:underline"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <PageTitle>Reset your password</PageTitle>
        <Body className="text-text-secondary">
          Enter your email and we&apos;ll send you a link to reset your
          password.
        </Body>
      </div>

      {state.status === "error" && state.message && (
        <InformationBanner variant="error">{state.message}</InformationBanner>
      )}

      <Input
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
      />

      <Button type="submit" loading={isPending}>
        Send reset link
      </Button>

      <Body className="text-center text-text-secondary">
        <Link href="/login" className="text-primary-300 hover:underline">
          Back to login
        </Link>
      </Body>
    </form>
  );
}
