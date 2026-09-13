import { googleSignInAction } from "@/lib/actions/google-signin";
import { Button } from "@/components/ui/button";
import type { AuthMessages } from "@/i18n/messages/types";

export interface GoogleSignInButtonProps {
  enabled: boolean;
  redirectTo?: string;
  messages: AuthMessages["google"];
}

export function GoogleSignInButton({
  enabled,
  redirectTo = "/dashboard",
  messages,
}: GoogleSignInButtonProps) {
  if (!enabled) {
    return (
      <Button variant="secondary" type="button" disabled>
        {messages.unavailable}
      </Button>
    );
  }

  const boundAction = googleSignInAction.bind(null, redirectTo);

  return (
    <form action={boundAction}>
      <Button variant="secondary" type="submit" className="w-full">
        {messages.continue}
      </Button>
    </form>
  );
}
