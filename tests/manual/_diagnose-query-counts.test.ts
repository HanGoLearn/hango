/**
 * ONE-OFF diagnostic (2026-08-21) - confirms getSpeakingLessonOptions'
 * createTtlCache wrap actually collapses the duplicate 164-lesson query
 * that Speaking Lab's page.tsx triggers today: getSpeakingPrompts(undefined)
 * calls getSpeakingLessonOptions() internally to resolve a default lesson,
 * AND page.tsx calls getSpeakingLessonOptions() again for the picker prop,
 * both inside the same Promise.all - the same stampede shape already found
 * and fixed for getContinueLearningTarget/getScenariosWithProgress.
 *
 * RUN: DEBUG_PRISMA_QUERIES=1 npx vitest run tests/manual/_diagnose-query-counts.test.ts --reporter=verbose
 */
import { describe, it } from "vitest";
import {
  getSpeakingPrompts,
  getSpeakingLessonOptions,
} from "@/lib/content/speaking-prompts";

describe("one-off diagnostic - not part of the regular CI suite", () => {
  it("logs real SQL statements for Speaking Lab page.tsx's exact call pattern (no lessonId)", async () => {
    console.log(">>> MARKER: Promise.all(getSpeakingPrompts(undefined), getSpeakingLessonOptions()) - START");
    const [prompts, options] = await Promise.all([
      getSpeakingPrompts(undefined),
      getSpeakingLessonOptions(),
    ]);
    console.log(">>> MARKER: Promise.all(getSpeakingPrompts(undefined), getSpeakingLessonOptions()) - END");
    console.log(`Options: ${options.length}, prompts ok: ${Boolean(prompts)}`);
  }, 30000);
});
