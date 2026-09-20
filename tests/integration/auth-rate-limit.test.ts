import { afterEach, describe, expect, it } from "vitest";
import {
  AuthRateLimitExceededError,
  consumeAuthRateLimit,
} from "@/lib/auth-rate-limit";
import { db } from "@/lib/db";

afterEach(async () => {
  await db.authRateLimitBucket.deleteMany();
});

describe("persistent authentication rate limits", () => {
  it("limits repeated login attempts for one normalized identity", async () => {
    const email = `rate-login-${Date.now()}@hango.dev`;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await consumeAuthRateLimit("login", email, { ip: null });
    }

    await expect(
      consumeAuthRateLimit("login", email, { ip: null }),
    ).rejects.toBeInstanceOf(AuthRateLimitExceededError);

    const buckets = await db.authRateLimitBucket.findMany({
      where: { key: { startsWith: "login:identity:" } },
    });
    expect(buckets.some((bucket) => bucket.count === 11)).toBe(true);
    expect(buckets.every((bucket) => !bucket.key.includes(email))).toBe(true);
  });

  it("limits one source IP even when it rotates registration addresses", async () => {
    const ip = "203.0.113.25";
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await consumeAuthRateLimit(
        "register",
        `rate-ip-${Date.now()}-${attempt}@hango.dev`,
        { ip },
      );
    }

    await expect(
      consumeAuthRateLimit(
        "register",
        `rate-ip-${Date.now()}-blocked@hango.dev`,
        { ip },
      ),
    ).rejects.toBeInstanceOf(AuthRateLimitExceededError);

    const buckets = await db.authRateLimitBucket.findMany();
    expect(buckets.every((bucket) => !bucket.key.includes(ip))).toBe(true);
  });
});
