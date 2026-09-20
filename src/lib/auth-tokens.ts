import "server-only";

import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;
const HASH_PREFIX = "sha256:";
const LEGACY_RAW_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

export function createOpaqueAuthToken(): {
  rawToken: string;
  tokenHash: string;
} {
  const rawToken = randomBytes(TOKEN_BYTES).toString("hex");
  return { rawToken, tokenHash: hashOpaqueAuthToken(rawToken) };
}

export function hashOpaqueAuthToken(rawToken: string): string {
  const digest = createHash("sha256").update(rawToken, "utf8").digest("hex");
  return `${HASH_PREFIX}${digest}`;
}

/**
 * During the rollout, accept a still-valid token created by the old code once.
 * New secrets are always stored only as hashes. The legacy candidate can be
 * removed after the longest old token TTL (24 hours) has elapsed in production.
 */
export function opaqueAuthTokenCandidates(rawToken: string): string[] {
  const tokenHash = hashOpaqueAuthToken(rawToken);
  return LEGACY_RAW_TOKEN_PATTERN.test(rawToken)
    ? [tokenHash, rawToken]
    : [tokenHash];
}
