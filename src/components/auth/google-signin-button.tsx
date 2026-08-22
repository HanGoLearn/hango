import { googleSignInAction } from "@/lib/actions/google-signin";
import { Button } from "@/components/ui/button";

export interface GoogleSignInButtonProps {
  enabled: boolean;
  redirectTo?: string;
}

export function GoogleSignInButton({
  enabled,
  redirectTo = "/dashboard",
}: GoogleSignInButtonProps) {
  if (!enabled) {
    return (
      <Button variant="secondary" type="button" disabled>
        Continue with Google (not configured)
      </Button>
    );
  }

  const boundAction = googleSignInAction.bind(null, redirectTo);

  return (
    <form action={boundAction}>
      <Button variant="secondary" type="submit" className="w-full">
        Continue with Google
      </Button>
    </form>
  );
}
