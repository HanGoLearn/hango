import "server-only";

/**
 * Email delivery is not specified anywhere in the docs. No real provider is
 * configured yet — this logs the link so registration/verification can be
 * developed and tested end-to-end. Swap the body of this function for a real
 * provider (Resend, SendGrid, etc.) later; call sites do not need to change.
 */
export async function sendVerificationEmail(
  email: string,
  verificationUrl: string,
): Promise<void> {
  console.log(
    `[dev email stub] Verification link for ${email}: ${verificationUrl}`,
  );
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  console.log(`[dev email stub] Password reset link for ${email}: ${resetUrl}`);
}
