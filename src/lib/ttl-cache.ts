/**
 * Plain in-memory TTL cache for rarely-changing, non-per-user data
 * (project/db-operations-optimization.md, Tier 3 - authored curriculum
 * metadata queried fresh on every relevant event across many requests).
 *
 * Deliberately not Next's `unstable_cache`/`"use cache"`: both require
 * Next's own request-lifecycle internals (`globalThis.__incrementalCache`
 * / a work-unit store) that only exist while an actual Next.js server is
 * handling a request - every integration test in this repo calls data-layer
 * functions directly, bypassing that entirely (see e.g.
 * scripts/measure-lesson-operations.test.ts's own header comment), so
 * either would throw "Invariant: incrementalCache missing" in every test
 * that touches a wrapped function. This has no such dependency - it works
 * identically under `next dev`/`next start` and under a plain test runner.
 *
 * Per-process memory, not shared across instances - acceptable here since
 * there is no live publish/unpublish action in this app (content only
 * changes via seed scripts/migrations, i.e. while instances are being
 * restarted anyway) and a `ttlMs`-bounded staleness window is the accepted
 * tradeoff, same as the code comments this replaces already accepted
 * ("cheap enough... revisit later").
 */
export function createTtlCache<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
  ttlMs: number,
  keyFn: (...args: Args) => string = (...args) => JSON.stringify(args),
): ((...args: Args) => Promise<T>) & { clear: () => void } {
  const store = new Map<string, { value: Promise<T>; expiresAt: number }>();

  const cached = async (...args: Args): Promise<T> => {
    const key = keyFn(...args);
    const entry = store.get(key);
    if (entry && entry.expiresAt > Date.now()) return entry.value;

    // Store the in-flight promise itself, synchronously, before awaiting -
    // not just its resolved value (2026-08-20, found via
    // project/learning-journey-optimization.md's Learning Journey
    // investigation: getDashboardData calls two callers of the same
    // cached fetch through one Promise.all, so both saw a cache miss in
    // the same tick and both hit the database - a classic stampede this
    // utility didn't guard against). A second concurrent call landing
    // before this one resolves now finds this promise already in `store`
    // and awaits the same one instead of starting its own.
    const value = fn(...args);
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
    try {
      return await value;
    } catch (error) {
      // Don't let a transient failure poison the cache for the rest of
      // the TTL window - matches the original behavior, which only ever
      // cached an already-resolved value.
      store.delete(key);
      throw error;
    }
  };
  cached.clear = () => store.clear();

  return cached;
}
