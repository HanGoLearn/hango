import { describe, expect, it } from "vitest";
import { getSpeakingPrompts } from "@/lib/content/speaking-prompts";
import { getLessonBySlug } from "@/lib/content/lesson";

/**
 * Regression coverage for a real bug found during manual verification
 * (FASE 10): the seeded Restaurant scenario originally had no
 * scenario-level Mission (`Mission.scenarioId` set), only a lesson-level
 * one - `getSpeakingPrompts()` assumed the former and silently left
 * SCENARIO_ROLE_PLAY unavailable. A fallback to the lesson mission was
 * added at the time; FASE 12 then seeded a real scenario-level mission
 * (12.4), so the fallback path is no longer exercised by this content, but
 * stays in place for any future scenario that doesn't have one yet.
 */
describe("getSpeakingPrompts (integration, real seeded database)", () => {
  it("provides a prompt for both remaining speaking modes from the real seeded content", async () => {
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const prompts = await getSpeakingPrompts(lesson!.id);

    expect(prompts.SHADOWING?.prompt).toBeTruthy();
    expect(prompts.SCENARIO_ROLE_PLAY?.prompt).toBeTruthy();
  });

  it("uses the scenario's own final mission for Scenario Role Play now that one exists (FASE 12)", async () => {
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const prompts = await getSpeakingPrompts(lesson!.id);

    expect(prompts.SCENARIO_ROLE_PLAY?.scenarioId).toBeTruthy();
    expect(prompts.SCENARIO_ROLE_PLAY?.lessonId).toBeUndefined();
  });
});
