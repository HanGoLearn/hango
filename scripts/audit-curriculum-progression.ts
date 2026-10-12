/** Read-only offline audit. Never imports runtime Han code or user data. */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import {
  buildCurriculumProgressionAudit,
  renderCurriculumProgressionAudit,
  type AuditLesson,
} from "../src/lib/content/curriculum-progression-audit";

async function main() {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== "--output-dir")) {
    throw new Error("Use no arguments or --output-dir project/<new-directory>");
  }
  const outputDir = args[1] ? resolve(args[1]) : null;
  if (outputDir) {
    const insideProject = relative(resolve("project"), outputDir);
    if (
      !insideProject ||
      insideProject === ".." ||
      insideProject.startsWith(`..${sep}`) ||
      isAbsolute(insideProject)
    ) {
      throw new Error("Output must be a new directory inside project");
    }
  }
  // Explicitly use this PC's local config, not a Vercel environment.
  const env = config({ path: ".env.local", quiet: true }).parsed;
  if (!env?.DATABASE_URL)
    throw new Error("DATABASE_URL in .env.local is required");
  const db = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: env.DATABASE_URL,
      max: 1,
      options: "-c default_transaction_read_only=on",
      connectionTimeoutMillis: 15000,
    }),
  });
  try {
    const scenarios = await db.scenario.findMany({
      orderBy: [
        { domain: { order: "asc" } },
        { order: "asc" },
        { slug: "asc" },
      ],
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        order: true,
        translations: { where: { locale: "ES" }, select: { name: true } },
        domain: { select: { order: true } },
        levels: {
          orderBy: [{ order: "asc" }, { id: "asc" }],
          select: {
            difficulty: true,
            order: true,
            lessons: {
              where: { status: "PUBLISHED" },
              orderBy: [{ order: "asc" }, { slug: "asc" }],
              select: {
                id: true,
                slug: true,
                title: true,
                communicationObjective: true,
                hskReference: true,
                order: true,
                translations: {
                  where: { locale: "ES" },
                  select: { title: true, communicationObjective: true },
                },
                vocabulary: {
                  orderBy: [{ order: "asc" }, { vocabularyItemId: "asc" }],
                  select: {
                    vocabularyItem: {
                      select: {
                        id: true,
                        chineseForm: true,
                        pinyin: true,
                        meaning: true,
                        hskLevel: true,
                        status: true,
                        translations: {
                          where: { locale: "ES" },
                          select: { meaning: true },
                        },
                        _count: { select: { examples: true } },
                      },
                    },
                  },
                },
                grammarPoints: {
                  orderBy: [{ order: "asc" }, { grammarPointId: "asc" }],
                  select: {
                    grammarPoint: {
                      select: {
                        id: true,
                        name: true,
                        structure: true,
                        hskLevel: true,
                        status: true,
                        translations: {
                          where: { locale: "ES" },
                          select: { name: true },
                        },
                        _count: {
                          select: {
                            examples: true,
                            exercises: { where: { status: "PUBLISHED" } },
                          },
                        },
                      },
                    },
                  },
                },
                missions: {
                  where: { status: "PUBLISHED" },
                  orderBy: { id: "asc" },
                  select: { id: true, aiRole: true, learnerRole: true },
                },
                dialogues: {
                  where: { status: "PUBLISHED" },
                  orderBy: { id: "asc" },
                  select: {
                    lines: {
                      orderBy: { order: "asc" },
                      select: { chineseText: true },
                    },
                  },
                },
                steps: { where: { type: "SPEAKING" }, select: { id: true } },
              },
            },
          },
        },
      },
    });
    const lessons: AuditLesson[] = scenarios.flatMap((s) =>
      s.levels.flatMap((level) =>
        level.lessons.map((l) => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          titleEs: l.translations[0]?.title ?? null,
          objective: l.communicationObjective,
          objectiveEs: l.translations[0]?.communicationObjective ?? null,
          order: l.order,
          levelOrder: level.order,
          difficulty: level.difficulty,
          hskReference: l.hskReference,
          scenario: {
            id: s.id,
            slug: s.slug,
            name: s.name,
            nameEs: s.translations[0]?.name ?? null,
            status: s.status,
            order: s.order,
            difficulties: s.levels.map((v) => v.difficulty),
            domainOrder: s.domain.order,
          },
          vocabulary: l.vocabulary.map(({ vocabularyItem: v }) => ({
            id: v.id,
            chineseForm: v.chineseForm,
            pinyin: v.pinyin,
            meaning: v.meaning,
            meaningEs: v.translations[0]?.meaning ?? null,
            hskLevel: v.hskLevel,
            status: v.status,
            exampleCount: v._count.examples,
          })),
          grammar: l.grammarPoints.map(({ grammarPoint: g }) => ({
            id: g.id,
            name: g.name,
            nameEs: g.translations[0]?.name ?? null,
            structure: g.structure,
            hskLevel: g.hskLevel,
            status: g.status,
            exampleCount: g._count.examples,
            exerciseCount: g._count.exercises,
          })),
          missions: l.missions,
          dialogueLineCount: l.dialogues.reduce(
            (sum, d) => sum + d.lines.length,
            0,
          ),
          dialoguePhrases: l.dialogues.flatMap((d) =>
            d.lines.map((line) => line.chineseText),
          ),
          hasSpeakingStep: l.steps.length > 0,
        })),
      ),
    );
    const audit = buildCurriculumProgressionAudit(lessons);
    const metadata = {
      generatedAt: new Date().toISOString(),
      source:
        "Local .env.local DATABASE_URL; PostgreSQL read-only connection; no Vercel inspection",
      contentSha256: createHash("sha256")
        .update(JSON.stringify(lessons))
        .digest("hex"),
      publishedScenarioCount: scenarios.filter((s) => s.status === "PUBLISHED")
        .length,
      emptyPublishedScenarioSlugs: scenarios
        .filter(
          (s) =>
            s.status === "PUBLISHED" && !s.levels.some((l) => l.lessons.length),
        )
        .map((s) => s.slug),
    };
    if (outputDir) {
      // Refuse overwriting any existing audit directory or other agent's work.
      await mkdir(outputDir);
      await writeFile(
        resolve(outputDir, "matriz.json"),
        JSON.stringify({ metadata, ...audit }, null, 2) + "\n",
        { flag: "wx" },
      );
      await writeFile(
        resolve(outputDir, "informe.md"),
        `Generado: ${metadata.generatedAt}\n\nHuella de contenido: \`${metadata.contentSha256}\`\n\n` +
          renderCurriculumProgressionAudit(audit),
        { flag: "wx" },
      );
    }
    console.log(
      JSON.stringify(
        {
          metadata,
          totals: audit.totals,
          chapters: audit.chapters,
          tiers: audit.tiers.map(
            ({
              priorLessonSlugs: _prior,
              proposedLessonSlugs: _direct,
              ...t
            }) => t,
          ),
          issueCounts: audit.issueCounts,
          repeatedForms: audit.repeatedForms.length,
          repeatedStructures: audit.repeatedExactStructures.length,
          lessonsWithIssues: audit.lessons
            .filter((l) => l.issues.length)
            .map((l) => ({ slug: l.slug, issues: l.issues })),
          outputDirectory: outputDir
            ? relative(process.cwd(), outputDir)
            : null,
        },
        null,
        2,
      ),
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  // Do not echo driver exceptions that may contain connection credentials.
  console.error(
    "Audit failed. Check local connection, query types, and new output directory. No database writes or AI calls were requested.",
  );
  const safe = error as {
    name?: string;
    code?: string;
    message?: string;
    cause?: { code?: string };
  };
  console.error(
    JSON.stringify({
      name: safe.name,
      code: safe.code,
      causeCode: safe.cause?.code,
      readOnlyRejected: /read.only|unsupported.*option/i.test(
        safe.message ?? "",
      ),
      connectionFailed: /connect|ENOTFOUND|EPERM|ECONN|timeout/i.test(
        safe.message ?? "",
      ),
    }),
  );
  process.exitCode = 1;
});
