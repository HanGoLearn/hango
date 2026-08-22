"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import {
  updateProfileNameAction,
  type SettingsActionState,
} from "@/lib/actions/settings";

const initialState: SettingsActionState = { status: "idle" };

export function ProfileSection({ initialName }: { initialName: string }) {
  const [state, formAction, isPending] = useActionState(
    updateProfileNameAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.status === "error" && (
        <InformationBanner variant="error">{state.message}</InformationBanner>
      )}
      <Input
        label="Name"
        name="name"
        defaultValue={initialName}
        maxLength={100}
      />
      <Button type="submit" loading={isPending} className="w-fit">
        Save
      </Button>
    </form>
  );
}
