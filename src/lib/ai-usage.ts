import "server-only";
import { db } from "@/lib/db";
import { estimateCostUsd, getTokenPricingUsdPerMillion } from "@/lib/ai/cost";
import {
  REALTIME_SESSION_ESTIMATE_USD,
  isRealtimeUsageFeature,
} from "@/lib/realtime-usage";
import {
  AI_FEATURE_FAMILY,
  type AiUsageFamily,
  type AiUsageFeature,
} from "@/lib/ai-feature-catalog";
export {
  AI_USAGE_FEATURES,
  AI_USAGE_LIMIT_FEATURES,
  AI_FEATURE_FAMILY,
  type AiUsageFamily,
  type AiUsageFeature,
} from "@/lib/ai-feature-catalog";
import {
  EXPERIENCE_BUDGET_MIGRATION,
  experienceLimitKey,
  fixedFeaturesForExperience,
  recordedAiExperience,
  resolveAiExperience,
  type AiExperience,
} from "@/lib/ai-experiences";

/**
 * Every real paid AI/TTS/STT surface in the app, one entry per feature that
 * calls recordAiUsage()/checkDailyUsageCap() (2026-09-05 cost audit). Keeping
 * this as a closed union - not a free string - means the admin AI-usage
 * dashboard can always show every feature (even ones with zero usage today)
 * and a typo in a call site fails to compile instead of silently logging
 * under a feature name nothing else recognizes.
 */
export const AI_USAGE_FAMILIES = ["TEXT", "STT", "TTS", "REALTIME"] as const;

const MICROUSD_PER_USD = 1_000_000;
export const DEFAULT_GLOBAL_DAILY_BUDGET_USD = 5;

/**
 * Preventive exposure estimate authorized before one provider operation.
 * These are intentionally round safety allowances, not pricing claims or a
 * substitute for the provider invoice or guaranteed maximum spend. Realtime
 * authorizes the user-approved US$0.05 estimate for one live session.
 */
export const AI_FAMILY_AUTHORIZATION_USD: Record<AiUsageFamily, number> = {
  TEXT: 0.02,
  STT: 0.03,
  TTS: 0.08,
  REALTIME: REALTIME_SESSION_ESTIMATE_USD,
};

export interface TrackAiOperationInput {
  userId: string;
  feature: AiUsageFeature;
  provider?: string;
  model?: string;
  experience?: AiExperience;
  /** Multi-provider workflows may perform their single cap check before any step. */
  capAlreadyChecked?: boolean;
}

/** Falls back to this when a feature has no row in AiUsageCap yet. */
export const DEFAULT_DAILY_CAP_USD = 1;

export class DailyUsageCapExceededError extends Error {}
export class AiFamilyDisabledError extends DailyUsageCapExceededError {}
export class GlobalAiBudgetExceededError extends DailyUsageCapExceededError {}

interface DailyUsageCapOptions {
  /**
   * Environment-specific fallback used only when neither an administrator nor
   * the learner has configured a feature limit. Explicit caps always win.
   */
  fallbackDailyLimitUsd?: number;
}

export function utcBudgetDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function usdToMicrousd(value: number): number {
  return Math.round(value * MICROUSD_PER_USD);
}

export function microusdToUsd(value: number): number {
  return value / MICROUSD_PER_USD;
}

function defaultGlobalBudgetMicrousd(): number {
  return usdToMicrousd(DEFAULT_GLOBAL_DAILY_BUDGET_USD);
}

function shouldReserveGlobalBudgetInThisEnvironment(): boolean {
  if (process.env.NODE_ENV !== "test") return true;
  // Integration tests share the development database. Ordinary provider
  // mocks must not consume or replace its real daily budget. Dedicated
  // budget tests explicitly opt in for the duration of their own test.
  return process.env.HANGO_ENFORCE_GLOBAL_AI_BUDGET_IN_TESTS === "true";
}

async function getGlobalBudgetPolicy() {
  const existing = await db.aiBudgetPolicy.findUnique({
    where: { id: "global" },
  });
  if (existing) return existing;

  await db.aiBudgetPolicy.createMany({
    data: [
      {
        id: "global",
        dailyLimitMicrousd: defaultGlobalBudgetMicrousd(),
      },
    ],
    skipDuplicates: true,
  });
  return db.aiBudgetPolicy.findUniqueOrThrow({ where: { id: "global" } });
}

function isFamilyEnabled(
  family: AiUsageFamily,
  policy: {
    textEnabled: boolean;
    sttEnabled: boolean;
    ttsEnabled: boolean;
    realtimeEnabled: boolean;
  },
): boolean {
  if (family === "TEXT") return policy.textEnabled;
  if (family === "STT") return policy.sttEnabled;
  if (family === "TTS") return policy.ttsEnabled;
  return policy.realtimeEnabled;
}

function normalizedOperationalErrorCode(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "timeout";
  }
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && /^[a-z0-9_-]{1,50}$/u.test(code)) {
      return code;
    }
  }
  return "unknown";
}

function resultIdentity(value: unknown): {
  provider?: string;
  model?: string;
} {
  if (!value || typeof value !== "object") return {};
  const candidate = value as { provider?: unknown; model?: unknown };
  return {
    provider:
      typeof candidate.provider === "string" ? candidate.provider : undefined,
    model: typeof candidate.model === "string" ? candidate.model : undefined,
  };
}

function safeLatencyMs(startedAt: number): number {
  return Math.max(0, Math.min(3_600_000, Math.round(Date.now() - startedAt)));
}

async function recordAiOperationBestEffort(input: {
  userId: string;
  feature: AiUsageFeature;
  experience?: AiExperience;
  provider?: string;
  model?: string;
  outcome: "SUCCESS" | "FAILURE" | "BLOCKED_CAP";
  errorCode?: string;
  latencyMs?: number;
}): Promise<void> {
  if (input.provider === "mock") return;
  try {
    await db.aiOperationLog.create({
      data: {
        userId: input.userId,
        feature: input.feature,
        experience: recordedAiExperience(input.feature, input.experience),
        provider: input.provider ?? null,
        model: input.model ?? null,
        outcome: input.outcome,
        errorCode: input.errorCode ?? null,
        latencyMs: input.latencyMs ?? null,
      },
    });
  } catch {
    // Observability must never turn a successful learner operation into an
    // error or replace the provider's real failure with a logging failure.
  }
}

/**
 * Wraps one real provider call. It records only operational metadata and
 * rethrows the original error unchanged so existing learner fallbacks keep
 * working. Cost accounting remains recordAiUsage()'s separate responsibility.
 */
export async function trackAiOperation<T>(
  input: TrackAiOperationInput,
  operation: () => Promise<T>,
): Promise<T> {
  if (!input.capAlreadyChecked && input.provider !== "mock") {
    await checkDailyUsageCap(input.userId, input.feature, {
      provider: input.provider,
      model: input.model,
      experience: input.experience,
    });
  }
  const startedAt = Date.now();
  try {
    const result = await operation();
    const identity = resultIdentity(result);
    await recordAiOperationBestEffort({
      ...input,
      provider: identity.provider ?? input.provider,
      model: identity.model ?? input.model,
      outcome: "SUCCESS",
      latencyMs: safeLatencyMs(startedAt),
    });
    return result;
  } catch (error) {
    await recordAiOperationBestEffort({
      ...input,
      outcome: "FAILURE",
      errorCode: normalizedOperationalErrorCode(error),
      latencyMs: safeLatencyMs(startedAt),
    });
    throw error;
  }
}

interface RecordAiUsageInput {
  userId: string;
  feature: AiUsageFeature;
  experience?: AiExperience;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd: number;
  durationSeconds?: number;
  durationSource?: AiUsageDurationSource;
}

export type AiUsageDurationSource =
  | "CLIENT_RECORDED"
  | "SERVER_DECODED"
  | "PROVIDER_REPORTED"
  | "BYTE_SIZE_ESTIMATE"
  | "TEXT_LENGTH_ESTIMATE";

export interface AiUsageCostMetadata {
  calculationMethod: "TOKEN_RATES" | "PER_MINUTE" | "LEGACY_ESTIMATE";
  inputRateUsdPerMillionTokens: number | null;
  outputRateUsdPerMillionTokens: number | null;
  audioRateUsdPerMinute: number | null;
  durationSeconds: number | null;
  durationSource: AiUsageDurationSource | null;
}

const TTS_FEATURES = new Set<AiUsageFeature>([
  "welcome-audio",
  "dialogue-audio",
  "grammar-audio",
  "vocabulary-audio",
  "placement-listening-audio",
  "han-speech",
]);

const STT_FEATURES = new Set<AiUsageFeature>([
  "han-teacher-transcribe",
  "speaking-transcribe",
]);

/** Pure metadata derivation, exported so rate snapshots can be verified without writing to a database. */
export function buildAiUsageCostMetadata(
  input: Pick<
    RecordAiUsageInput,
    | "feature"
    | "model"
    | "inputTokens"
    | "outputTokens"
    | "durationSeconds"
    | "durationSource"
  >,
): AiUsageCostMetadata {
  const tokenBilled =
    input.inputTokens !== undefined && input.outputTokens !== undefined;
  const minuteBilled =
    TTS_FEATURES.has(input.feature) || STT_FEATURES.has(input.feature);
  const tokenPricing = tokenBilled
    ? getTokenPricingUsdPerMillion(input.model)
    : null;
  const audioRateUsdPerMinute = TTS_FEATURES.has(input.feature)
    ? TTS_COST_PER_MINUTE_USD
    : STT_FEATURES.has(input.feature)
      ? STT_COST_PER_MINUTE_USD
      : null;
  const durationSeconds =
    input.durationSeconds !== undefined &&
    Number.isFinite(input.durationSeconds) &&
    input.durationSeconds >= 0
      ? input.durationSeconds
      : null;

  return {
    calculationMethod: tokenBilled
      ? "TOKEN_RATES"
      : minuteBilled
        ? "PER_MINUTE"
        : "LEGACY_ESTIMATE",
    inputRateUsdPerMillionTokens: tokenPricing?.input ?? null,
    outputRateUsdPerMillionTokens: tokenPricing?.output ?? null,
    audioRateUsdPerMinute,
    durationSeconds,
    durationSource:
      durationSeconds === null ? null : (input.durationSource ?? null),
  };
}

/** Called after a real paid call succeeds - never on a cache hit or a mock-provider response. */
export async function recordAiUsage(
  input: RecordAiUsageInput,
): Promise<string> {
  const metadata = buildAiUsageCostMetadata(input);
  const experience =
    AI_FEATURE_FAMILY[input.feature] &&
    !["ai-teacher-chat", "han-realtime-session"].includes(input.feature)
      ? resolveAiExperience(input.feature, input.experience)
      : null;

  const log = await db.aiUsageLog.create({
    data: {
      userId: input.userId,
      feature: input.feature,
      experience,
      provider: input.provider,
      model: input.model,
      inputTokens: input.inputTokens ?? null,
      outputTokens: input.outputTokens ?? null,
      estimatedCostUsd: input.estimatedCostUsd,
      ...metadata,
    },
  });
  return log.id;
}

function startOfTodayUtc(): Date {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

/**
 * Per-user, per-experience daily estimated spend cap - a second,
 * slower-but-broader layer on top of each feature's existing 5-minute
 * in-memory burst limiter. The burst limiter stops a fast, accidental spike
 * (a bug looping, a fat-fingered spam-click); this stops the same account
 * from quietly staying just under that burst limit for hours. Checked AFTER
 * the cheap in-memory limiter passes, so a request already rejected there
 * never pays for this DB round trip.
 */
export async function checkDailyUsageCap(
  userId: string,
  feature: AiUsageFeature,
  identity: {
    provider?: string;
    model?: string;
    experience?: AiExperience;
  } = {},
  options: DailyUsageCapOptions = {},
): Promise<void> {
  const experience = resolveAiExperience(feature, identity.experience);
  const limitKey = experienceLimitKey(experience);
  const policyMigration = EXPERIENCE_BUDGET_MIGRATION;
  if (policyMigration) {
    // Fail closed until the one-time experience policy copy is deployed. Missing new rows
    // must not silently replace a previous per-user block with the default cap.
    const [migration] = await db.$queryRaw<{ applied: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM "_prisma_migrations"
        WHERE "migration_name" = ${policyMigration}
          AND "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL
      ) AS applied
    `;
    if (!migration?.applied) {
      throw new DailyUsageCapExceededError(
        "This AI experience is temporarily unavailable while its shared budget is being configured.",
      );
    }
  }
  const [userCap, cap, usage, policy] = await Promise.all([
    db.aiUsageUserCap.findUnique({
      where: { userId_feature: { userId, feature: limitKey } },
    }),
    db.aiUsageCap.findUnique({ where: { feature: limitKey } }),
    db.aiUsageLog.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfTodayUtc() },
        OR: [
          { experience },
          {
            experience: null,
            feature: { in: fixedFeaturesForExperience(experience) },
          },
        ],
      },
      _sum: { estimatedCostUsd: true },
    }),
    getGlobalBudgetPolicy(),
  ]);
  const fallbackDailyLimitUsd =
    options.fallbackDailyLimitUsd !== undefined &&
    Number.isFinite(options.fallbackDailyLimitUsd) &&
    options.fallbackDailyLimitUsd > 0
      ? options.fallbackDailyLimitUsd
      : DEFAULT_DAILY_CAP_USD;
  const limit =
    userCap?.dailyLimitUsd ?? cap?.dailyLimitUsd ?? fallbackDailyLimitUsd;
  const spentToday = usage._sum.estimatedCostUsd ?? 0;
  // Include the next session's estimate, using integer microdollars to avoid
  // rounding away an exact US$0.05 daily allowance.
  const exceedsSessionLimit =
    isRealtimeUsageFeature(feature) &&
    usdToMicrousd(spentToday) + usdToMicrousd(REALTIME_SESSION_ESTIMATE_USD) >
      usdToMicrousd(limit);
  if (
    usdToMicrousd(spentToday) >= usdToMicrousd(limit) ||
    exceedsSessionLimit
  ) {
    const errorCode = userCap
      ? limit === 0
        ? "user_feature_blocked"
        : "user_cap_exceeded"
      : "daily_cap_exceeded";
    await recordAiOperationBestEffort({
      userId,
      feature,
      ...identity,
      outcome: "BLOCKED_CAP",
      errorCode,
    });
    throw new DailyUsageCapExceededError(
      limit === 0
        ? "This feature isn't available for your account."
        : "You've reached today's usage limit for this feature. Please try again tomorrow.",
    );
  }

  const family = AI_FEATURE_FAMILY[feature];
  if (!isFamilyEnabled(family, policy)) {
    await recordAiOperationBestEffort({
      userId,
      feature,
      ...identity,
      outcome: "BLOCKED_CAP",
      errorCode: `family_${family.toLowerCase()}_disabled`,
    });
    throw new AiFamilyDisabledError(
      "This AI feature is temporarily paused. Please try again later.",
    );
  }

  if (!shouldReserveGlobalBudgetInThisEnvironment()) {
    return;
  }

  const reservationMicrousd = usdToMicrousd(
    AI_FAMILY_AUTHORIZATION_USD[family],
  );
  const maximumBeforeReservation =
    policy.dailyLimitMicrousd - reservationMicrousd;
  const day = utcBudgetDay();

  const authorizedRows =
    maximumBeforeReservation < 0
      ? 0
      : await db.$executeRaw`
          INSERT INTO "AiDailyBudgetCounter"
            ("day", "authorizedMicrousd", "authorizationCount", "updatedAt")
          VALUES
            (${day}, ${reservationMicrousd}, 1, CURRENT_TIMESTAMP)
          ON CONFLICT ("day") DO UPDATE SET
            "authorizedMicrousd" = "AiDailyBudgetCounter"."authorizedMicrousd" + ${reservationMicrousd},
            "authorizationCount" = "AiDailyBudgetCounter"."authorizationCount" + 1,
            "updatedAt" = CURRENT_TIMESTAMP
          WHERE "AiDailyBudgetCounter"."authorizedMicrousd" <= ${maximumBeforeReservation}
        `;

  if (authorizedRows === 0) {
    await recordAiOperationBestEffort({
      userId,
      feature,
      ...identity,
      outcome: "BLOCKED_CAP",
      errorCode: "global_budget_exceeded",
    });
    throw new GlobalAiBudgetExceededError(
      "AI is temporarily unavailable because the beta safety limit was reached. Please try again later.",
    );
  }
}

export { estimateCostUsd };

// gpt-4o-mini-tts is billed per input text token + per audio output token,
// but the raw /v1/audio/speech response returns no usage/token metadata to
// read those from - this approximates total cost from a blended ~$0.015/min
// public rate (OpenAI community pricing discussion, 2026) and an assumed
// speech rate, the same "rough, not billing-accurate" spirit already
// documented in ai/cost.ts.
const TTS_CHARACTERS_PER_SECOND = 15;
const TTS_COST_PER_MINUTE_USD = 0.015;

export function estimateTtsDurationSeconds(spokenText: string): number {
  return spokenText.length / TTS_CHARACTERS_PER_SECOND;
}

export function estimateTtsCostUsd(spokenText: string): number {
  const estimatedSeconds = estimateTtsDurationSeconds(spokenText);
  return (estimatedSeconds / 60) * TTS_COST_PER_MINUTE_USD;
}

// whisper-1 is billed per minute of input audio (2026 published rate).
const STT_COST_PER_MINUTE_USD = 0.006;

export function estimateSttCostUsd(durationSeconds: number): number {
  return (durationSeconds / 60) * STT_COST_PER_MINUTE_USD;
}

// Rough fallback for the one STT call site with no real recorded duration
// (transcribeHanMessageAction) - browser MediaRecorder voice clips are
// typically encoded around 32kbps (webm/opus), so this backs into an
// approximate duration from the blob's byte size instead of leaving that
// call uncosted entirely.
const ASSUMED_VOICE_BITRATE_BPS = 32_000;

export function estimateAudioDurationSecondsFromBytes(bytes: number): number {
  return (bytes * 8) / ASSUMED_VOICE_BITRATE_BPS;
}
