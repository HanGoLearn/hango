import { describe, expect, it } from "vitest";
import { summarizeTranslationCoverage } from "@/lib/content/translation-coverage";

const counts = [
  { area: "scenarios" as const, total: 10, explicitTranslations: 4 },
  { area: "lessons" as const, total: 0, explicitTranslations: 0 },
];

describe("curriculum translation coverage", () => {
  it("reports missing Spanish rows as English fallback", () => {
    expect(summarizeTranslationCoverage("es", counts)).toEqual([
      {
        area: "scenarios",
        total: 10,
        explicitTranslations: 4,
        translated: 4,
        fallback: 6,
        coveragePercent: 40,
      },
      {
        area: "lessons",
        total: 0,
        explicitTranslations: 0,
        translated: 0,
        fallback: 0,
        coveragePercent: 100,
      },
    ]);
  });

  it("treats canonical English base content as complete", () => {
    expect(summarizeTranslationCoverage("en", counts)[0]).toMatchObject({
      translated: 10,
      fallback: 0,
      coveragePercent: 100,
    });
  });
});
