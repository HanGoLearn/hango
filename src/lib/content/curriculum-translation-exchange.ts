import { createHash } from "node:crypto";
import { z } from "zod";

export const curriculumTranslationUnitSchema = z.object({
  key: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  field: z.string().min(1),
  context: z.string().min(1),
  source: z.string().min(1),
  translation: z.string(),
});

export type CurriculumTranslationUnit = z.infer<
  typeof curriculumTranslationUnitSchema
>;

export const curriculumTranslationPackageSchema = z.object({
  schemaVersion: z.literal(1),
  targetLocale: z.literal("es"),
  generatedAt: z.string().datetime(),
  scenario: z.object({
    id: z.string().min(1),
    slug: z.string().min(1),
    sourceName: z.string().min(1),
  }),
  sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
  translationBaselineHash: z.string().regex(/^[a-f0-9]{64}$/),
  instructions: z.array(z.string().min(1)).min(1),
  units: z.array(curriculumTranslationUnitSchema).min(1),
});

export type CurriculumTranslationPackage = z.infer<
  typeof curriculumTranslationPackageSchema
>;

function sourcePayload(units: readonly CurriculumTranslationUnit[]) {
  return units.map(
    ({ key, entityType, entityId, field, context, source }, index) => ({
      index,
      key,
      entityType,
      entityId,
      field,
      context,
      source,
    }),
  );
}

export function curriculumTranslationSourceHash(
  units: readonly CurriculumTranslationUnit[],
) {
  return createHash("sha256")
    .update(JSON.stringify(sourcePayload(units)))
    .digest("hex");
}

export function curriculumTranslationBaselineHash(
  units: readonly CurriculumTranslationUnit[],
) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        units.map(({ key, translation }) => ({ key, translation })),
      ),
    )
    .digest("hex");
}

function collectMatches(value: string, pattern: RegExp) {
  return [...value.matchAll(pattern)].map((match) => match[0]).sort();
}

function containsEverySourceFragment(
  sourceFragments: readonly string[],
  translatedFragments: readonly string[],
) {
  const translatedCounts = new Map<string, number>();
  for (const fragment of translatedFragments) {
    translatedCounts.set(fragment, (translatedCounts.get(fragment) ?? 0) + 1);
  }

  for (const fragment of sourceFragments) {
    const remaining = translatedCounts.get(fragment) ?? 0;
    if (remaining === 0) return false;
    translatedCounts.set(fragment, remaining - 1);
  }

  return true;
}

function missingProtectedFragments(source: string, translation: string) {
  const checks = [
    {
      label: "texto chino",
      pattern: /\p{Script=Han}+/gu,
      allowAdditionalMatches: false,
    },
    {
      label: "marcador",
      pattern: /\{\{[^{}]+\}\}|\{[^{}]+\}|%[a-zA-Z]|\$\{[^{}]+\}/g,
      allowAdditionalMatches: false,
    },
    {
      label: "pinyin con tonos",
      pattern:
        /\b[A-Za-züÜvVāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+[1-5]\b|\b[A-Za-züÜvV]*[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ][A-Za-züÜvVāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]*\b/gu,
      // Spanish translations naturally add words such as "está", "número"
      // and "situación". Those matches are harmless; only pinyin fragments
      // present in the canonical source must survive unchanged.
      allowAdditionalMatches: true,
    },
    {
      label: "URL",
      pattern: /https?:\/\/[^\s)]+/g,
      allowAdditionalMatches: false,
    },
  ];

  const missing: string[] = [];
  for (const check of checks) {
    const sourceFragments = collectMatches(source, check.pattern);
    const translatedFragments = collectMatches(translation, check.pattern);
    const fragmentsArePreserved = check.allowAdditionalMatches
      ? containsEverySourceFragment(sourceFragments, translatedFragments)
      : JSON.stringify(sourceFragments) === JSON.stringify(translatedFragments);
    if (!fragmentsArePreserved) {
      missing.push(check.label);
    }
  }
  return missing;
}

export interface TranslationPackageValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCurriculumTranslationPackage(
  value: unknown,
  options: { requireComplete?: boolean } = {},
): TranslationPackageValidationResult {
  const parsed = curriculumTranslationPackageSchema.safeParse(value);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      ),
    };
  }

  const errors: string[] = [];
  const { units, sourceHash } = parsed.data;
  const seen = new Set<string>();

  if (curriculumTranslationSourceHash(units) !== sourceHash) {
    errors.push(
      "La firma del contenido original no coincide; source o la estructura del archivo fueron modificados.",
    );
  }

  for (const unit of units) {
    if (seen.has(unit.key)) errors.push(`Clave duplicada: ${unit.key}`);
    seen.add(unit.key);

    if (options.requireComplete && unit.translation.trim().length === 0) {
      errors.push(`Falta traducción: ${unit.key}`);
      continue;
    }

    if (unit.translation.trim().length > 0) {
      const missing = missingProtectedFragments(unit.source, unit.translation);
      if (missing.length > 0) {
        errors.push(
          `${unit.key}: la traducción alteró ${missing.join(", ")} protegido.`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function translationValueMap(
  translationPackage: CurriculumTranslationPackage,
) {
  return new Map(
    translationPackage.units.map((unit) => [unit.key, unit.translation.trim()]),
  );
}

type CurriculumTranslationPackageRebaseResult =
  | {
      valid: true;
      rebased: boolean;
      translationPackage: CurriculumTranslationPackage;
      errors: [];
    }
  | {
      valid: false;
      rebased: false;
      errors: string[];
    };

const portableUnitFields = [
  "entityType",
  "field",
  "context",
  "source",
] as const satisfies readonly (keyof CurriculumTranslationUnit)[];

/**
 * Re-keys a reviewed translation package for an equivalent freshly seeded
 * database. Prisma-assigned entity IDs may differ between databases, but the
 * ordered authored source must remain byte-for-byte identical. Any real
 * content or structural drift aborts the rebase before an import can write.
 */
export function rebaseCurriculumTranslationPackage(
  currentPackage: CurriculumTranslationPackage,
  incomingPackage: CurriculumTranslationPackage,
): CurriculumTranslationPackageRebaseResult {
  if (currentPackage.sourceHash === incomingPackage.sourceHash) {
    return {
      valid: true,
      rebased: false,
      translationPackage: incomingPackage,
      errors: [],
    };
  }

  const errors: string[] = [];
  if (currentPackage.scenario.slug !== incomingPackage.scenario.slug) {
    errors.push("El slug del escenario no coincide.");
  }
  if (
    currentPackage.scenario.sourceName !== incomingPackage.scenario.sourceName
  ) {
    errors.push("El nombre fuente del escenario no coincide.");
  }
  if (currentPackage.units.length !== incomingPackage.units.length) {
    errors.push(
      `La cantidad de unidades cambió: ${incomingPackage.units.length} en el paquete y ${currentPackage.units.length} en la base actual.`,
    );
  }

  const comparableLength = Math.min(
    currentPackage.units.length,
    incomingPackage.units.length,
  );
  for (let index = 0; index < comparableLength; index += 1) {
    const currentUnit = currentPackage.units[index]!;
    const incomingUnit = incomingPackage.units[index]!;
    const changedFields = portableUnitFields.filter(
      (field) => currentUnit[field] !== incomingUnit[field],
    );
    if (changedFields.length > 0) {
      errors.push(
        `La unidad ${index + 1} cambió en ${changedFields.join(", ")}.`,
      );
      if (errors.length >= 10) break;
    }
  }

  if (errors.length > 0) {
    return { valid: false, rebased: false, errors };
  }

  const units = currentPackage.units.map((currentUnit, index) => ({
    ...currentUnit,
    translation: incomingPackage.units[index]!.translation,
  }));

  return {
    valid: true,
    rebased: true,
    translationPackage: {
      ...currentPackage,
      generatedAt: incomingPackage.generatedAt,
      instructions: incomingPackage.instructions,
      units,
      sourceHash: curriculumTranslationSourceHash(units),
      // The current database state is now the baseline used for the conflict
      // check immediately before the atomic import.
      translationBaselineHash: currentPackage.translationBaselineHash,
    },
    errors: [],
  };
}

/**
 * Finds translations already stored after an export that would be overwritten
 * with a different value. Matching shared rows (for example a domain or a
 * reused vocabulary item translated by an earlier scenario import) are safe
 * to reuse during the additive curriculum rollout.
 */
export function conflictingCurrentTranslationKeys(
  currentPackage: CurriculumTranslationPackage,
  incomingPackage: CurriculumTranslationPackage,
) {
  const incomingValues = translationValueMap(incomingPackage);
  return currentPackage.units.flatMap((unit) => {
    const currentValue = unit.translation.trim();
    if (!currentValue || incomingValues.get(unit.key) === currentValue) {
      return [];
    }
    return [unit.key];
  });
}
