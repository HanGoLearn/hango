import { describe, expect, it } from "vitest";
import {
  conflictingCurrentTranslationKeys,
  curriculumTranslationBaselineHash,
  curriculumTranslationSourceHash,
  rebaseCurriculumTranslationPackage,
  validateCurriculumTranslationPackage,
  type CurriculumTranslationPackage,
} from "@/lib/content/curriculum-translation-exchange";

function packageFixture(): CurriculumTranslationPackage {
  const units = [
    {
      key: "exercise:one:prompt",
      entityType: "exercise",
      entityId: "one",
      field: "prompt",
      context: "Lesson: Greetings",
      source: "Complete 你好 (nǐ hǎo) using {name}.",
      translation:
        "Completa 你好 (nǐ hǎo) usando {name}, según la situación práctica.",
    },
  ];
  return {
    schemaVersion: 1,
    targetLocale: "es",
    generatedAt: "2026-09-11T12:00:00.000Z",
    scenario: {
      id: "scenario-one",
      slug: "greetings",
      sourceName: "Greetings",
    },
    sourceHash: curriculumTranslationSourceHash(units),
    translationBaselineHash: curriculumTranslationBaselineHash(units),
    instructions: ["Edit translations only."],
    units,
  };
}

describe("curriculum translation exchange", () => {
  it("accepts a complete package with protected fragments intact", () => {
    expect(
      validateCurriculumTranslationPackage(packageFixture(), {
        requireComplete: true,
      }),
    ).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("rejects changes to source content", () => {
    const value = packageFixture();
    value.units[0]!.source = "Changed source";
    expect(validateCurriculumTranslationPackage(value).errors).toContain(
      "La firma del contenido original no coincide; source o la estructura del archivo fueron modificados.",
    );
  });

  it("rejects missing translations and altered Chinese or placeholders", () => {
    const missing = packageFixture();
    missing.units[0]!.translation = "";
    expect(
      validateCurriculumTranslationPackage(missing, { requireComplete: true })
        .valid,
    ).toBe(false);

    const altered = packageFixture();
    altered.units[0]!.translation = "Completa 您好 (ni hao) usando {nombre}.";
    const result = validateCurriculumTranslationPackage(altered, {
      requireComplete: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain(
      "texto chino, marcador, pinyin con tonos",
    );
  });

  it("allows Spanish accents that are not source pinyin", () => {
    const value = packageFixture();
    value.units[0]!.source = "Are you busy?";
    value.units[0]!.translation = "¿Estás ocupado?";
    value.sourceHash = curriculumTranslationSourceHash(value.units);

    expect(
      validateCurriculumTranslationPackage(value, { requireComplete: true }),
    ).toEqual({ valid: true, errors: [] });
  });

  it("allows matching shared translations after another scenario import", () => {
    const incoming = packageFixture();
    incoming.translationBaselineHash = curriculumTranslationBaselineHash(
      incoming.units.map((unit) => ({ ...unit, translation: "" })),
    );
    const current = structuredClone(incoming);
    current.translationBaselineHash = curriculumTranslationBaselineHash(
      current.units,
    );

    expect(conflictingCurrentTranslationKeys(current, incoming)).toEqual([]);
  });

  it("reports a shared translation that would overwrite concurrent work", () => {
    const incoming = packageFixture();
    incoming.translationBaselineHash = curriculumTranslationBaselineHash(
      incoming.units.map((unit) => ({ ...unit, translation: "" })),
    );
    const current = structuredClone(incoming);
    current.units[0]!.translation =
      "Completa 你好 (nǐ hǎo) con un texto diferente y {name}.";
    current.translationBaselineHash = curriculumTranslationBaselineHash(
      current.units,
    );

    expect(conflictingCurrentTranslationKeys(current, incoming)).toEqual([
      "exercise:one:prompt",
    ]);
  });

  it("re-keys an equivalent reviewed package for a freshly seeded database", () => {
    const incoming = packageFixture();
    const current = structuredClone(incoming);
    current.scenario.id = "fresh-scenario-id";
    current.units[0]!.key = "exercise:fresh-exercise-id:prompt";
    current.units[0]!.entityId = "fresh-exercise-id";
    current.units[0]!.translation = "";
    current.sourceHash = curriculumTranslationSourceHash(current.units);
    current.translationBaselineHash = curriculumTranslationBaselineHash(
      current.units,
    );

    const result = rebaseCurriculumTranslationPackage(current, incoming);

    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.rebased).toBe(true);
    expect(result.translationPackage.scenario.id).toBe("fresh-scenario-id");
    expect(result.translationPackage.units[0]).toMatchObject({
      key: "exercise:fresh-exercise-id:prompt",
      entityId: "fresh-exercise-id",
      translation: incoming.units[0]!.translation,
    });
    expect(result.translationPackage.sourceHash).toBe(current.sourceHash);
    expect(result.translationPackage.translationBaselineHash).toBe(
      current.translationBaselineHash,
    );
  });

  it("refuses to re-key when authored source content changed", () => {
    const incoming = packageFixture();
    const current = structuredClone(incoming);
    current.scenario.id = "fresh-scenario-id";
    current.units[0]!.key = "exercise:fresh-exercise-id:prompt";
    current.units[0]!.entityId = "fresh-exercise-id";
    current.units[0]!.source = "Changed authored source";
    current.sourceHash = curriculumTranslationSourceHash(current.units);

    const result = rebaseCurriculumTranslationPackage(current, incoming);

    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.errors).toContain("La unidad 1 cambió en source.");
  });
});
