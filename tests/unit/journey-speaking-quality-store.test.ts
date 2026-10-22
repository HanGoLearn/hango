import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createLocalJourneyQualityStore } from "@/lib/journey-speaking-quality-store";
const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});
async function setup() {
  const root = await mkdtemp(join(tmpdir(), "hango-quality-store-test-"));
  roots.push(root);
  return { root, store: createLocalJourneyQualityStore(root) };
}
describe("private development review ledger", () => {
  it("allows exactly one concurrent claim and never removes it after a saved result", async () => {
    const { root, store } = await setup();
    const key = "a".repeat(64);
    const claims = await Promise.all(
      Array.from({ length: 8 }, () => store.claim(key, { state: "claimed" })),
    );
    expect(claims.filter(Boolean)).toHaveLength(1);
    await store.saveSummary(key, { state: "REFUSED" });
    expect(await store.claim(key, {})).toBe(false);
    expect(
      JSON.parse(await readFile(join(root, key, "claim.json"), "utf8")),
    ).toEqual({ state: "claimed" });
  });
  it("preserves raw responses and does not overwrite existing evidence", async () => {
    const { root, store } = await setup();
    const key = "b".repeat(64);
    await store.claim(key, {});
    await store.saveResponse(key, { text: "original" });
    await store.saveInspection(key, { state: "REJECTED_CANDIDATE" });
    await expect(
      store.saveResponse(key, { text: "replacement" }),
    ).rejects.toThrow();
    expect(
      JSON.parse(await readFile(join(root, key, "response.json"), "utf8")),
    ).toEqual({ text: "original" });
  });
  it("reads only summaries and leaves incomplete claimed jobs without a fabricated result", async () => {
    const { store } = await setup();
    const key = "c".repeat(64);
    await store.claim(key, {});
    expect(await store.readSummary(key)).toBeNull();
    await store.saveSummary(key, { state: "VALIDATED_CANDIDATE" });
    expect(await store.readSummary(key)).toEqual({
      state: "VALIDATED_CANDIDATE",
    });
  });
  it("rejects path traversal or non-digest identifiers", async () => {
    const { store } = await setup();
    await expect(store.claim("../outside", {})).rejects.toThrow(/Invalid/);
    await expect(store.readSummary("x")).rejects.toThrow(/Invalid/);
  });
});
