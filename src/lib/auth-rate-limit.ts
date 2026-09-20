import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env/server";

export class AuthRateLimitExceededError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Too many authentication attempts.");
  }
}

interface LimitRule {
  scope: string;
  subject: string;
  limit: number;
  windowMs: number;
}

export interface AuthRequestIdentity {
  ip: string | null;
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

const LIMITS = {
  loginIdentity: { limit: 10, windowMs: FIFTEEN_MINUTES },
  loginIp: { limit: 50, windowMs: FIFTEEN_MINUTES },
  registerIdentity: { limit: 3, windowMs: ONE_DAY },
  registerIp: { limit: 10, windowMs: ONE_HOUR },
  recoveryIdentity: { limit: 5, windowMs: ONE_HOUR },
  recoveryIp: { limit: 25, windowMs: ONE_HOUR },
  resetIdentity: { limit: 10, windowMs: ONE_HOUR },
  resetIp: { limit: 50, windowMs: ONE_HOUR },
} as const;

function subjectFingerprint(value: string): string {
  return createHmac("sha256", serverEnv.AUTH_SECRET)
    .update(value, "utf8")
    .digest("hex");
}

function normalizedForwardedIp(value: string | null): string | null {
  const candidate = value?.split(",", 1)[0]?.trim();
  return candidate && isIP(candidate) ? candidate : null;
}

export async function getAuthRequestIdentity(): Promise<AuthRequestIdentity> {
  try {
    const requestHeaders = await headers();
    const ip =
      normalizedForwardedIp(requestHeaders.get("cf-connecting-ip")) ??
      normalizedForwardedIp(requestHeaders.get("x-real-ip")) ??
      normalizedForwardedIp(requestHeaders.get("x-forwarded-for"));
    return { ip };
  } catch {
    // Direct data-layer tests and maintenance scripts do not have an HTTP
    // request context. The email-derived limit remains active in that case.
    return { ip: null };
  }
}

async function consumeRule(rule: LimitRule, now: Date): Promise<void> {
  const windowStartMs =
    Math.floor(now.getTime() / rule.windowMs) * rule.windowMs;
  const expiresAtMs = windowStartMs + rule.windowMs;
  const key = `${rule.scope}:${windowStartMs}:${subjectFingerprint(rule.subject)}`;

  const bucket = await db.authRateLimitBucket.upsert({
    where: { key },
    create: {
      key,
      count: 1,
      windowStart: new Date(windowStartMs),
      expiresAt: new Date(expiresAtMs),
    },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  if (bucket.count > rule.limit) {
    throw new AuthRateLimitExceededError(
      Math.max(1, Math.ceil((expiresAtMs - now.getTime()) / 1000)),
    );
  }
}

async function consumeRules(rules: LimitRule[]): Promise<void> {
  const now = new Date();
  for (const rule of rules) {
    await consumeRule(rule, now);
  }

  // Opportunistic bounded cleanup. Correctness never depends on this delete;
  // it only prevents expired fixed-window rows accumulating indefinitely.
  if (now.getTime() - lastCleanupAt >= FIFTEEN_MINUTES) {
    lastCleanupAt = now.getTime();
    await db.authRateLimitBucket.deleteMany({
      where: { expiresAt: { lt: now } },
    });
  }
}

let lastCleanupAt = 0;

function rulesFor(
  scope: "login" | "register" | "recovery" | "reset",
  email: string,
  identity: AuthRequestIdentity,
): LimitRule[] {
  const identityLimit = LIMITS[`${scope}Identity`];
  const ipLimit = LIMITS[`${scope}Ip`];
  const rules: LimitRule[] = [
    {
      scope: `${scope}:identity`,
      subject: email,
      ...identityLimit,
    },
  ];
  if (identity.ip) {
    rules.push({
      scope: `${scope}:ip`,
      subject: identity.ip,
      ...ipLimit,
    });
  }
  return rules;
}

export async function consumeAuthRateLimit(
  scope: "login" | "register" | "recovery" | "reset",
  email: string,
  identity: AuthRequestIdentity,
): Promise<void> {
  await consumeRules(rulesFor(scope, email, identity));
}
