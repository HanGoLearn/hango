/**
 * Friendly messages for Auth.js's ?error= codes (authentication.md — errors
 * should be "Clear. Helpful. Secure."). Unknown codes fall back to a generic
 * message rather than exposing internal error names.
 */
export function getAuthErrorMessage(
  code: string | undefined,
): string | undefined {
  if (!code) return undefined;

  switch (code) {
    case "OAuthAccountNotLinked":
      return "That Google account's email doesn't match an existing HanGo account with a verified email. Try logging in with your password instead.";
    case "AccessDenied":
      return "Google sign-in was cancelled.";
    case "Configuration":
      return "Google sign-in isn't available right now. Please log in with your email and password.";
    default:
      return "We couldn't complete sign-in with Google. Please try again.";
  }
}
