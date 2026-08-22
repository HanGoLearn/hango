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

const initialState: ResetPasswordFormState = { status: "idle" };

export interface ResetPasswordFormProps {
  email: string;
  token: string;
}

export function ResetPasswordForm({ email, token }: ResetPasswordFormProps) {
  const boundAction = resetPasswordAction.bind(null, email, token);
  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState,
  );

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-4 text-center">
        <PageTitle>Password updated</PageTitle>
        <InformationBanner variant="success">{state.message}</InformationBanner>
        <Link
          href="/login"
          className="font-interface text-supporting text-primary-300 hover:underline"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <PageTitle>Choose a new password</PageTitle>
      </div>

      {state.status === "error" && state.message && (
        <InformationBanner variant="error">{state.message}</InformationBanner>
      )}

      <Input
        name="password"
        type="password"
        label="New password"
        autoComplete="new-password"
        required
        hint="At least 8 characters"
      />

      <Button type="submit" loading={isPending}>
        Update password
      </Button>
    </form>
  );
}
