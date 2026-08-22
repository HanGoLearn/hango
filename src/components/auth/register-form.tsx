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

const initialState: RegisterFormState = { status: "idle" };

export interface RegisterFormProps {
  googleEnabled: boolean;
}

export function RegisterForm({ googleEnabled }: RegisterFormProps) {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState,
  );
  const [termsAccepted, setTermsAccepted] = useState(false);

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
    // Two sibling <form> elements, not nested — see login-form.tsx for why.
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-center">
        <PageTitle>Create your account</PageTitle>
        <Body className="text-text-secondary">
          Learn Chinese through real communication.
        </Body>
      </div>

      {state.status === "error" && state.message && (
        <InformationBanner variant="error">{state.message}</InformationBanner>
      )}

      <form action={formAction} className="flex flex-col gap-5">
        <Input
          name="name"
          label="Name"
          autoComplete="name"
          required
          error={state.fieldErrors?.name}
        />
        <Input
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          error={state.fieldErrors?.email}
        />
        <Input
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          required
          error={state.fieldErrors?.password}
          hint="At least 8 characters"
        />

        <Checkbox
          label="I agree to the Terms of Service and Privacy Policy"
          checked={termsAccepted}
          onCheckedChange={(checked) => setTermsAccepted(checked === true)}
        />

        <Button
          type="submit"
          loading={isPending}
          disabled={!termsAccepted || isPending}
        >
          Create account
        </Button>
      </form>

      <GoogleSignInButton enabled={googleEnabled} />

      <Body className="text-center text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-primary-300 hover:underline">
          Log in
        </Link>
      </Body>
    </div>
  );
}
