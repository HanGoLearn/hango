import "server-only";
import { z } from "zod";

const optionalNonEmptyString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.url(),
  AUTH_SECRET: z.string().min(32),
  // Optional: Google Sign-In (FASE 2.5) is disabled when these are unset —
  // see src/lib/auth.ts. Get these from https://console.cloud.google.com/apis/credentials.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // Transactional email. Both values are required together in production;
  // development/test can run without delivery and never print secret links.
  RESEND_API_KEY: optionalNonEmptyString,
  EMAIL_FROM: optionalNonEmptyString,
  // Optional: the AI Teacher (FASE 8) falls back to a mock provider when
  // both of these are unset — see src/lib/ai/index.ts. OPENAI_API_KEY is
  // preferred when both are set (OpenAI is the project's chosen provider).
  // Get real values from https://platform.openai.com/api-keys or
  // https://console.anthropic.com (API Keys).
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  // Optional: the weekly leaderboard payout endpoint (2026-08-30) returns
  // 503 when unset - see app/api/cron/weekly-leaderboard-payout/route.ts.
  // Whatever schedules the weekly call (Vercel Cron, an external cron
  // service, etc.) must send this same value as `Authorization: Bearer
  // <value>` - Vercel Cron does this automatically for a var named exactly
  // CRON_SECRET.
  CRON_SECRET: z.string().optional(),
});

const parsed = serverSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
});

if (!parsed.success) {
  throw new Error(
    `Invalid private environment variables: ${parsed.error.message}`,
  );
}

export const serverEnv = parsed.data;
