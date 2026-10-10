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

function portableUnitSignature(unit: CurriculumTranslationUnit) {
  return JSON.stringify(
    portableUnitFields.map((field) => [field, unit[field]]),
  );
}

function unitsByPortableSignature(units: readonly CurriculumTranslationUnit[]) {
  const groups = new Map<string, CurriculumTranslationUnit[]>();
  for (const unit of units) {
    const signature = portableUnitSignature(unit);
    const group = groups.get(signature) ?? [];
    group.push(unit);
    groups.set(signature, group);
  }
  return groups;
}

/**
 * Re-keys a reviewed translation package for an equivalent freshly seeded
 * database. Prisma-assigned entity IDs and the order of equally ranked rows
 * may differ between databases, but the authored source must remain
 * byte-for-byte identical as a multiset. Any real content, structural drift,
 * or ambiguous duplicate translation aborts the rebase before an import can
 * write.
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

  const currentGroups = unitsByPortableSignature(currentPackage.units);
  const incomingGroups = unitsByPortableSignature(incomingPackage.units);

  for (const [signature, currentUnits] of currentGroups) {
    const incomingCount = incomingGroups.get(signature)?.length ?? 0;
    if (currentUnits.length !== incomingCount) {
      const example = currentUnits[0]!;
      errors.push(
        `El contenido actual no coincide con el paquete revisado (${example.entityType}.${example.field}, ${JSON.stringify(example.context)}): ${currentUnits.length} unidad(es) en la base y ${incomingCount} en el paquete.`,
      );
      if (errors.length >= 10) break;
    }
  }

  if (errors.length < 10) {
    for (const [signature, incomingUnits] of incomingGroups) {
      if (currentGroups.has(signature)) continue;
      const example = incomingUnits[0]!;
      errors.push(
        `El paquete contiene texto que ya no existe en la base actual (${example.entityType}.${example.field}, ${JSON.stringify(example.context)}).`,
      );
      if (errors.length >= 10) break;
    }
  }

  if (errors.length > 0) {
    return { valid: false, rebased: false, errors };
  }

  const translationsByCurrentKey = new Map<string, string>();

  for (const [signature, currentUnits] of currentGroups) {
    const incomingUnits = incomingGroups.get(signature)!;
    const currentKeys = new Set(currentUnits.map((unit) => unit.key));
    const incomingByKey = new Map(
      incomingUnits.map((unit) => [unit.key, unit] as const),
    );
    const matchedIncomingKeys = new Set<string>();

    // Stable entity IDs are the strongest possible match and also resolve
    // duplicate source/context rows whose translations intentionally differ.
    for (const currentUnit of currentUnits) {
      const exactMatch = incomingByKey.get(currentUnit.key);
      if (!exactMatch) continue;
      translationsByCurrentKey.set(currentUnit.key, exactMatch.translation);
      matchedIncomingKeys.add(exactMatch.key);
    }

    const unmatchedCurrent = currentUnits.filter(
      (unit) => !translationsByCurrentKey.has(unit.key),
    );
    const unmatchedIncoming = incomingUnits.filter(
      (unit) =>
        !matchedIncomingKeys.has(unit.key) && !currentKeys.has(unit.key),
    );

    if (unmatchedCurrent.length === 0) continue;

    const translations = new Set(
      unmatchedIncoming.map((unit) => unit.translation),
    );
    if (
      unmatchedCurrent.length !== unmatchedIncoming.length ||
      translations.size !== 1
    ) {
      const example = unmatchedCurrent[0]!;
      errors.push(
        `No se puede reasignar de forma inequívoca una traducción duplicada (${example.entityType}.${example.field}, ${JSON.stringify(example.context)}).`,
      );
      if (errors.length >= 10) break;
      continue;
    }

    const [translation] = translations;
    for (const currentUnit of unmatchedCurrent) {
      translationsByCurrentKey.set(currentUnit.key, translation!);
    }
  }

  if (errors.length > 0) {
    return { valid: false, rebased: false, errors };
  }

  const units = currentPackage.units.map((currentUnit) => ({
    ...currentUnit,
    translation: translationsByCurrentKey.get(currentUnit.key)!,
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
