import "server-only";
import { z } from "zod";

const optionalNonEmptyString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const optionalPoolSize = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().int().min(1).max(20).optional(),
);

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.url(),
  // Keep serverless connection pools deliberately small. Local development
  // retains its larger pool unless this is explicitly overridden.
  DATABASE_POOL_MAX: optionalPoolSize,
  // Explicit local opt-in only; production must remain on its current rollout.
  HANGO_JOURNEY_EVALUATION_V2: z.enum(["off", "local"]).default("off"),
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
  // Closed-beta curriculum scope. FOUNDATIONS_ONLY is the safe default for
  // the first beginner cohort; FULL restores the complete published journey
  // and the existing full Speaking Lab without a code change.
  HANGO_BETA_LEARNING_SCOPE: z
    .enum(["FOUNDATIONS_ONLY", "FULL"])
    .default("FOUNDATIONS_ONLY"),
  // Closed-beta account creation. Existing accounts can always sign in;
  // INVITE_ONLY only gates creation of new credential and OAuth accounts.
  HANGO_BETA_ACCESS_MODE: z
    .enum(["INVITE_ONLY", "OPEN"])
    .default("INVITE_ONLY"),
  // Local disk is development/test only. Production defaults to the private
  // Vercel Blob provider in src/lib/storage. New Vercel projects use
  // short-lived OIDC credentials plus BLOB_STORE_ID; BLOB_READ_WRITE_TOKEN is
  // retained only for legacy or non-Vercel environments.
  HANGO_STORAGE_PROVIDER: z.enum(["local", "vercel-blob"]).optional(),
  BLOB_STORE_ID: optionalNonEmptyString,
  BLOB_READ_WRITE_TOKEN: optionalNonEmptyString,
});

const parsed = serverSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX,
  HANGO_JOURNEY_EVALUATION_V2: process.env.HANGO_JOURNEY_EVALUATION_V2,
  AUTH_SECRET: process.env.AUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
  HANGO_BETA_LEARNING_SCOPE: process.env.HANGO_BETA_LEARNING_SCOPE,
  HANGO_BETA_ACCESS_MODE: process.env.HANGO_BETA_ACCESS_MODE,
  HANGO_STORAGE_PROVIDER: process.env.HANGO_STORAGE_PROVIDER,
  BLOB_STORE_ID: process.env.BLOB_STORE_ID,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
});

if (!parsed.success) {
  throw new Error(
    `Invalid private environment variables: ${parsed.error.message}`,
  );
}

export const serverEnv = parsed.data;
