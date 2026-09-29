import "server-only";

import type { AppLocale } from "@/i18n/config";
import { serverEnv } from "@/lib/env/server";
import {
  markOperationalHeartbeatBestEffort,
  recordOperationalEventBestEffort,
} from "@/lib/operational-events";

export class EmailDeliveryConfigurationError extends Error {}
export class EmailDeliveryError extends Error {}

export function isTransactionalEmailConfigured(): boolean {
  return Boolean(serverEnv.RESEND_API_KEY && serverEnv.EMAIL_FROM);
}

async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  if (!isTransactionalEmailConfigured()) {
    if (serverEnv.NODE_ENV === "production") {
      await recordOperationalEventBestEffort({
        source: "EMAIL",
        severity: "CRITICAL",
        code: "email_not_configured",
      });
      throw new EmailDeliveryConfigurationError(
        "Transactional email is not configured.",
      );
    }

    // Keep local/test flows usable without leaking bearer links into logs.
    console.info(
      `[dev email disabled] Suppressed transactional email to ${input.to}.`,
    );
    return;
  }

  await markOperationalHeartbeatBestEffort({
    key: "email.transactional",
    status: "RUNNING",
  });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverEnv.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: serverEnv.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        text: input.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new EmailDeliveryError(
        `Transactional email provider returned HTTP ${response.status}.`,
      );
    }
    await markOperationalHeartbeatBestEffort({
      key: "email.transactional",
      status: "HEALTHY",
    });
  } catch (error) {
    const errorCode =
      error instanceof EmailDeliveryError ? "provider_http_error" : "timeout";
    await Promise.all([
      markOperationalHeartbeatBestEffort({
        key: "email.transactional",
        status: "FAILED",
        errorCode,
      }),
      recordOperationalEventBestEffort({
        source: "EMAIL",
        severity: "CRITICAL",
        code: errorCode,
      }),
    ]);
    throw error;
  }
}

export async function sendVerificationEmail(
  email: string,
  verificationUrl: string,
  locale: AppLocale,
): Promise<void> {
  const spanish = locale === "es";
  await sendTransactionalEmail({
    to: email,
    subject: spanish
      ? "Verifica tu cuenta de HanGo"
      : "Verify your HanGo account",
    text: spanish
      ? `Verifica tu cuenta de HanGo abriendo este enlace:\n\n${verificationUrl}\n\nSi no creaste esta cuenta, ignora este mensaje.`
      : `Verify your HanGo account by opening this link:\n\n${verificationUrl}\n\nIf you did not create this account, ignore this message.`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  locale: AppLocale,
): Promise<void> {
  const spanish = locale === "es";
  await sendTransactionalEmail({
    to: email,
    subject: spanish
      ? "Restablece tu contraseña de HanGo"
      : "Reset your HanGo password",
    text: spanish
      ? `Restablece tu contraseña de HanGo abriendo este enlace:\n\n${resetUrl}\n\nEl enlace vence en una hora. Si no lo solicitaste, ignora este mensaje.`
      : `Reset your HanGo password by opening this link:\n\n${resetUrl}\n\nThe link expires in one hour. If you did not request it, ignore this message.`,
  });
}
