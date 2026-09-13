import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";
import { PrismaClient } from "@/generated/prisma/client";

config({ path: ".env.local" });

const ES = "ES" as const;
const apply = process.argv.includes("--apply");
const writingPackagePath = resolve(
  "project/curriculum-translations/es/standalone-writing.json",
);

const writingPackageSchema = z.object({
  schemaVersion: z.literal(1),
  targetLocale: z.literal("es"),
  tasks: z.array(
    z.object({
      id: z.string().min(1),
      sourceTitle: z.string(),
      sourcePrompt: z.string(),
      translation: z.object({
        title: z.string().min(1),
        prompt: z.string().min(1),
      }),
    }),
  ),
});

type Candidate<T> = { value: T; count: number };

function sourceKey(parts: Array<string | null | undefined>) {
  return JSON.stringify(parts);
}

function addCandidate<T>(
  index: Map<string, Map<string, Candidate<T>>>,
  key: string,
  value: T,
) {
  const serialized = JSON.stringify(value);
  const candidates = index.get(key) ?? new Map<string, Candidate<T>>();
  const existing = candidates.get(serialized);
  candidates.set(serialized, {
    value,
    count: (existing?.count ?? 0) + 1,
  });
  index.set(key, candidates);
}

function selectCandidate<T>(
  index: Map<string, Map<string, Candidate<T>>>,
  key: string,
  label: string,
) {
  const candidates = [...(index.get(key)?.values() ?? [])].sort(
    (left, right) =>
      right.count - left.count ||
      JSON.stringify(left.value).localeCompare(JSON.stringify(right.value)),
  );
  const selected = candidates[0];
  if (!selected) {
    throw new Error("No validated Spanish equivalent found for " + label + ".");
  }
  return { value: selected.value, ambiguous: candidates.length > 1 };
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required in .env.local.");
  }
  const database = new PrismaClient({
    adapter: new PrismaPg({ connectionString, max: 2 }),
  });

  try {
    const [
      vocabularySources,
      vocabularyTargets,
      grammarSources,
      grammarTargets,
      grammarExampleSources,
      grammarExampleTargets,
      rawWritingPackage,
    ] = await Promise.all([
      database.vocabularyItem.findMany({
        where: {
          status: "PUBLISHED",
          lessons: { some: {} },
          translations: { some: { locale: ES } },
        },
        select: {
          chineseForm: true,
          pinyin: true,
          meaning: true,
          partOfSpeech: true,
          translations: {
            where: { locale: ES },
            select: { meaning: true, partOfSpeech: true },
          },
        },
      }),
      database.vocabularyItem.findMany({
        where: {
          status: "PUBLISHED",
          lessons: { none: {} },
          translations: { none: { locale: ES } },
        },
        select: {
          id: true,
          chineseForm: true,
          pinyin: true,
          meaning: true,
          partOfSpeech: true,
        },
      }),
      database.grammarPoint.findMany({
        where: {
          status: "PUBLISHED",
          lessons: { some: {} },
          translations: { some: { locale: ES } },
        },
        select: {
          name: true,
          structure: true,
          communicationPurpose: true,
          explanation: true,
          commonMistake: true,
          translations: {
            where: { locale: ES },
            select: {
              name: true,
              communicationPurpose: true,
              explanation: true,
              commonMistake: true,
            },
          },
        },
      }),
      database.grammarPoint.findMany({
        where: {
          status: "PUBLISHED",
          lessons: { none: {} },
          translations: { none: { locale: ES } },
        },
        select: {
          id: true,
          name: true,
          structure: true,
          communicationPurpose: true,
          explanation: true,
          commonMistake: true,
        },
      }),
      database.grammarExample.findMany({
        where: {
          grammarPoint: { status: "PUBLISHED", lessons: { some: {} } },
          translations: { some: { locale: ES } },
        },
        select: {
          chineseText: true,
          pinyin: true,
          translation: true,
          translations: {
            where: { locale: ES },
            select: { translation: true },
          },
        },
      }),
      database.grammarExample.findMany({
        where: {
          grammarPoint: { status: "PUBLISHED", lessons: { none: {} } },
          translations: { none: { locale: ES } },
        },
        select: {
          id: true,
          chineseText: true,
          pinyin: true,
          translation: true,
        },
      }),
      readFile(writingPackagePath, "utf8"),
    ]);

    const vocabularyIndex = new Map<
      string,
      Map<string, Candidate<{ meaning: string; partOfSpeech: string | null }>>
    >();
    for (const item of vocabularySources) {
      const translation = item.translations[0];
      if (!translation) continue;
      addCandidate(
        vocabularyIndex,
        sourceKey([
          item.chineseForm,
          item.pinyin,
          item.meaning,
          item.partOfSpeech,
        ]),
        translation,
      );
    }

    let ambiguousVocabulary = 0;
    const vocabularyData = vocabularyTargets.map((item) => {
      const selected = selectCandidate(
        vocabularyIndex,
        sourceKey([
          item.chineseForm,
          item.pinyin,
          item.meaning,
          item.partOfSpeech,
        ]),
        "vocabulary item " + item.id,
      );
      if (selected.ambiguous) ambiguousVocabulary += 1;
      return { vocabularyItemId: item.id, locale: ES, ...selected.value };
    });

    const grammarIndex = new Map<
      string,
      Map<
        string,
        Candidate<{
          name: string;
          communicationPurpose: string | null;
          explanation: string;
          commonMistake: string | null;
        }>
      >
    >();
    for (const point of grammarSources) {
      const translation = point.translations[0];
      if (!translation) continue;
      addCandidate(
        grammarIndex,
        sourceKey([
          point.name,
          point.structure,
          point.communicationPurpose,
          point.explanation,
          point.commonMistake,
        ]),
        translation,
      );
    }

    let ambiguousGrammar = 0;
    const grammarData = grammarTargets.map((point) => {
      const selected = selectCandidate(
        grammarIndex,
        sourceKey([
          point.name,
          point.structure,
          point.communicationPurpose,
          point.explanation,
          point.commonMistake,
        ]),
        "grammar point " + point.id,
      );
      if (selected.ambiguous) ambiguousGrammar += 1;
      return { grammarPointId: point.id, locale: ES, ...selected.value };
    });

    const grammarExampleIndex = new Map<
      string,
      Map<string, Candidate<{ translation: string }>>
    >();
    for (const example of grammarExampleSources) {
      const translation = example.translations[0];
      if (!translation) continue;
      addCandidate(
        grammarExampleIndex,
        sourceKey([example.chineseText, example.pinyin, example.translation]),
        translation,
      );
    }

    let ambiguousGrammarExamples = 0;
    const grammarExampleData = grammarExampleTargets.map((example) => {
      const selected = selectCandidate(
        grammarExampleIndex,
        sourceKey([example.chineseText, example.pinyin, example.translation]),
        "grammar example " + example.id,
      );
      if (selected.ambiguous) ambiguousGrammarExamples += 1;
      return { grammarExampleId: example.id, locale: ES, ...selected.value };
    });

    const writingPackage = writingPackageSchema.parse(
      JSON.parse(rawWritingPackage),
    );
    const writingTasks = await database.writingTask.findMany({
      where: { id: { in: writingPackage.tasks.map((task) => task.id) } },
      include: {
        translations: {
          where: { locale: ES },
          select: { title: true, prompt: true },
        },
      },
    });
    const writingById = new Map(writingTasks.map((task) => [task.id, task]));
    const writingData: Array<{
      writingTaskId: string;
      locale: typeof ES;
      title: string;
      prompt: string;
    }> = [];

    for (const packaged of writingPackage.tasks) {
      const current = writingById.get(packaged.id);
      if (!current) {
        throw new Error("Writing task not found: " + packaged.id + ".");
      }
      if (current.lessonId || current.scenarioId) {
        throw new Error(
          "Writing task is no longer standalone: " + packaged.id + ".",
        );
      }
      if (
        current.title !== packaged.sourceTitle ||
        current.prompt !== packaged.sourcePrompt
      ) {
        throw new Error(
          "Writing task source changed after translation: " + packaged.id + ".",
        );
      }
      const existing = current.translations[0];
      if (existing) {
        if (
          existing.title !== packaged.translation.title ||
          existing.prompt !== packaged.translation.prompt
        ) {
          throw new Error(
            "Spanish writing translation already differs: " + packaged.id + ".",
          );
        }
        continue;
      }
      writingData.push({
        writingTaskId: packaged.id,
        locale: ES,
        ...packaged.translation,
      });
    }

    console.log("Standalone Spanish translation backfill");
    console.log("Vocabulary rows ready: " + vocabularyData.length);
    console.log(
      "Vocabulary rows resolved by deterministic consensus: " +
        ambiguousVocabulary,
    );
    console.log("Grammar rows ready: " + grammarData.length);
    console.log(
      "Grammar rows resolved by deterministic consensus: " + ambiguousGrammar,
    );
    console.log("Grammar example rows ready: " + grammarExampleData.length);
    console.log(
      "Grammar examples resolved by deterministic consensus: " +
        ambiguousGrammarExamples,
    );
    console.log("Writing rows ready: " + writingData.length);

    if (!apply) {
      console.log("Dry run only: add --apply to write atomically.");
      return;
    }

    await database.$transaction(
      async (transaction) => {
        if (vocabularyData.length > 0) {
          await transaction.vocabularyItemTranslation.createMany({
            data: vocabularyData,
          });
        }
        if (grammarData.length > 0) {
          await transaction.grammarPointTranslation.createMany({
            data: grammarData,
          });
        }
        if (grammarExampleData.length > 0) {
          await transaction.grammarExampleTranslation.createMany({
            data: grammarExampleData,
          });
        }
        if (writingData.length > 0) {
          await transaction.writingTaskTranslation.createMany({
            data: writingData,
          });
        }
      },
      { maxWait: 10_000, timeout: 120_000 },
    );
    console.log("Standalone Spanish translations imported atomically.");
  } finally {
    await database.$disconnect();
  }
}

void main();
