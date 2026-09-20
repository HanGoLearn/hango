// Seeds just enough Spanish curriculum content for the integration/component
// suite's Spanish-locale assertions to be true on ANY freshly-seeded
// database - CI's ephemeral Postgres, a local ephemeral cluster, a new
// teammate's machine - not only the one shared dev database where the full
// project/curriculum-translations/es/ packages were originally reviewed and
// imported.
//
// Why this exists instead of importing those packages here (2026-09-16,
// project/AUDITORIA_INTEGRAL_Y_PROXIMOS_PASOS.md QA-02): each package's
// sourceHash is computed over every unit's `key`/`entityId`, which embed the
// database-generated id of the row it was exported from
// (src/lib/content/curriculum-translation-exchange.ts's sourcePayload). A
// fresh `prisma db seed` run assigns brand new ids to the same authored
// English text, so sourceHash can never match there even though the text is
// identical - making every exported package inherently single-database.
// Redesigning that keying to be id-independent would touch the same
// exchange format already used to review and import all 41 scenarios
// against the real database, which is a bigger, riskier change than this
// task calls for. This script instead looks up its handful of target rows
// by their stable natural key (scenario/domain slug, lesson order) in
// whatever database it runs against, and upserts known-correct Spanish text
// already reviewed as part of project/curriculum-translations/es/
// getting-started.json - so it stays exactly consistent with that larger,
// human-reviewed translation, just scoped to what tests actually assert on.
//
// This is NOT a substitute for that full translation system and does not
// attempt to cover the rest of the curriculum - only the Getting Started
// domain/scenario/first-lesson triple that
// tests/integration/content.test.ts and tests/integration/recommendation.test.ts
// assert on. Safe to run more than once (idempotent upserts); safe to run
// against the real dev database too (upserts the same values it already has).
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

config({ path: ".env.local" });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const scenario = await db.scenario.findFirstOrThrow({
      where: { slug: "getting-started" },
      select: {
        id: true,
        domainId: true,
        levels: {
          orderBy: { order: "asc" },
          take: 1,
          select: {
            lessons: {
              orderBy: { order: "asc" },
              take: 1,
              select: { id: true, title: true, communicationObjective: true },
            },
          },
        },
      },
    });
    const firstLesson = scenario.levels[0]?.lessons[0];
    if (!firstLesson) {
      throw new Error(
        "getting-started has no first lesson to attach a Spanish title to - was it seeded?",
      );
    }

    await db.domainTranslation.upsert({
      where: {
        domainId_locale: { domainId: scenario.domainId, locale: "ES" },
      },
      create: { domainId: scenario.domainId, locale: "ES", name: "Fundamentos" },
      update: { name: "Fundamentos" },
    });

    await db.scenarioTranslation.upsert({
      where: { scenarioId_locale: { scenarioId: scenario.id, locale: "ES" } },
      create: { scenarioId: scenario.id, locale: "ES", name: "Primeros pasos" },
      update: { name: "Primeros pasos" },
    });

    const communicationObjective =
      "Al final de esta lección, podrás saludar a alguien, decir tu nombre, preguntar el suyo y compartir tu nacionalidad.";
    await db.lessonTranslation.upsert({
      where: { lessonId_locale: { lessonId: firstLesson.id, locale: "ES" } },
      create: {
        lessonId: firstLesson.id,
        locale: "ES",
        title: "Saludos y presentaciones",
        communicationObjective,
      },
      update: { title: "Saludos y presentaciones", communicationObjective },
    });

    console.log(
      `Seeded ES fixtures: domain "Fundamentos", scenario "Primeros pasos", lesson "${firstLesson.title}" -> "Saludos y presentaciones".`,
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
