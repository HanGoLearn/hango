import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTtlCache } from "@/lib/ttl-cache";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createTtlCache", () => {
  it("calls the underlying function once and reuses the result within the TTL window", async () => {
    const fn = vi.fn().mockResolvedValue("value");
    const cached = createTtlCache(fn, 1000);

    expect(await cached()).toBe("value");
    expect(await cached()).toBe("value");
    vi.advanceTimersByTime(999);
    expect(await cached()).toBe("value");

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("recomputes once the TTL has expired", async () => {
    const fn = vi.fn().mockResolvedValueOnce("first").mockResolvedValueOnce("second");
    const cached = createTtlCache(fn, 1000);

    expect(await cached()).toBe("first");
    vi.advanceTimersByTime(1001);
    expect(await cached()).toBe("second");

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("caches separately per distinct argument set", async () => {
    const fn = vi.fn().mockImplementation(async (id: string) => `result-${id}`);
    const cached = createTtlCache(fn, 1000);

    expect(await cached("a")).toBe("result-a");
    expect(await cached("b")).toBe("result-b");
    expect(await cached("a")).toBe("result-a");

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("clear() forces the next call to recompute immediately", async () => {
    const fn = vi.fn().mockResolvedValueOnce("first").mockResolvedValueOnce("second");
    const cached = createTtlCache(fn, 1000);

    expect(await cached()).toBe("first");
    cached.clear();
    expect(await cached()).toBe("second");

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("concurrent calls before the first resolves share one in-flight call, not one each (2026-08-20 stampede fix - project/learning-journey-optimization.md)", async () => {
    vi.useRealTimers(); // real microtask/macrotask interleaving needed to exercise the race
    let resolveFn!: (value: string) => void;
    const fn = vi.fn().mockImplementation(
      () => new Promise<string>((resolve) => { resolveFn = resolve; }),
    );
    const cached = createTtlCache(fn, 1000);

    const first = cached();
    const second = cached();
    resolveFn("value");

    expect(await first).toBe("value");
    expect(await second).toBe("value");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not cache a rejection - the next call (concurrent or later) recomputes instead of staying broken for the TTL window", async () => {
    vi.useRealTimers();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValueOnce("recovered");
    const cached = createTtlCache(fn, 1000);

    await expect(cached()).rejects.toThrow("transient");
    expect(await cached()).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
