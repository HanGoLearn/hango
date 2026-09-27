import { describe, expect, it } from "vitest";
import {
  resolveTourState,
  sanitizeTourHintIds,
  type TourProfileFacts,
} from "@/lib/tour-progress";

const FINISHED_ONBOARDING = new Date("2026-09-23T10:00:00Z");

function facts(overrides: Partial<TourProfileFacts> = {}): TourProfileFacts {
  return {
    onboardingCompletedAt: FINISHED_ONBOARDING,
    tourCompletedAt: null,
    tourSkippedAt: null,
    seenTourHints: [],
    hasStudied: false,
    ...overrides,
  };
}

describe("who the guided tour opens for", () => {
  it("opens by itself only for someone who just finished onboarding", () => {
    expect(resolveTourState(facts())).toEqual({
      audience: "NEW",
      autoStart: true,
      seenHints: [],
    });
  });

  it("never ambushes someone who was already using HanGo", () => {
    // The case most likely to go wrong: an established learner must not be
    // handed an introduction to an app they clearly know.
    const state = resolveTourState(facts({ hasStudied: true }));

    expect(state.audience).toBe("EXISTING");
    expect(state.autoStart).toBe(false);
  });

  it("does not reopen for someone who left it", () => {
    const state = resolveTourState(
      facts({ tourSkippedAt: new Date("2026-09-23T11:00:00Z") }),
    );

    expect(state.audience).toBe("SKIPPED");
    expect(state.autoStart).toBe(false);
  });

  it("does not reopen for someone who finished it", () => {
    const state = resolveTourState(
      facts({ tourCompletedAt: new Date("2026-09-23T11:00:00Z") }),
    );

    expect(state.audience).toBe("COMPLETED");
    expect(state.autoStart).toBe(false);
  });

  it("treats completed as settled even if a skip was also recorded", () => {
    // Replaying the tour and leaving partway must not downgrade someone who
    // already finished it once.
    const state = resolveTourState(
      facts({
        tourCompletedAt: new Date("2026-09-23T11:00:00Z"),
        tourSkippedAt: new Date("2026-09-24T11:00:00Z"),
      }),
    );

    expect(state.audience).toBe("COMPLETED");
  });

  it("stays shut while onboarding is unfinished", () => {
    const state = resolveTourState(facts({ onboardingCompletedAt: null }));

    expect(state.audience).toBe("EXISTING");
    expect(state.autoStart).toBe(false);
  });

  it("carries the sections already explained through every state", () => {
    // The hints read this list before rendering, so it has to survive
    // whichever branch the learner falls into.
    const seen = ["journey", "han"];

    for (const overrides of [
      {},
      { hasStudied: true },
      { tourSkippedAt: FINISHED_ONBOARDING },
      { tourCompletedAt: FINISHED_ONBOARDING },
    ]) {
      expect(
        resolveTourState(facts({ ...overrides, seenTourHints: seen }))
          .seenHints,
      ).toEqual(seen);
    }
  });
});

describe("guided tour hint input", () => {
  it("keeps only known unique section ids", () => {
    expect(
      sanitizeTourHintIds([
        "journey",
        "journey",
        "invented-client-value",
        42,
        "settings",
      ]),
    ).toEqual(["journey", "settings"]);
  });

  it("rejects a non-array payload", () => {
    expect(sanitizeTourHintIds({ hintId: "journey" })).toEqual([]);
  });
});
