import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import {
  curriculumTranslationPackageSchema,
  curriculumTranslationBaselineHash,
  curriculumTranslationSourceHash,
  conflictingCurrentTranslationKeys,
  translationValueMap,
  validateCurriculumTranslationPackage,
  type CurriculumTranslationPackage,
  type CurriculumTranslationUnit,
} from "@/lib/content/curriculum-translation-exchange";

config({ path: ".env.local" });

const ES = "ES" as const;
const IMPORT_TRANSACTION_TIMEOUT_MS = 5 * 60_000;

const scenarioInclude = {
  translations: { where: { locale: ES } },
  domain: { include: { translations: { where: { locale: ES } } } },
  learningObjectives: {
    orderBy: { order: "asc" as const },
    include: { translations: { where: { locale: ES } } },
  },
  missions: {
    where: { status: "PUBLISHED" as const },
    include: {
      translations: { where: { locale: ES } },
      successConditions: {
        orderBy: { order: "asc" as const },
        include: { translations: { where: { locale: ES } } },
      },
      evaluationCriteria: {
        orderBy: { order: "asc" as const },
        include: { translations: { where: { locale: ES } } },
      },
    },
  },
  writingTasks: {
    where: { status: "PUBLISHED" as const },
    include: { translations: { where: { locale: ES } } },
  },
  levels: {
    orderBy: { order: "asc" as const },
    include: {
      lessons: {
        where: { status: "PUBLISHED" as const },
        orderBy: { order: "asc" as const },
        include: {
          translations: { where: { locale: ES } },
          steps: {
            orderBy: { order: "asc" as const },
            include: { translations: { where: { locale: ES } } },
          },
          learningObjectives: {
            orderBy: { order: "asc" as const },
            include: { translations: { where: { locale: ES } } },
          },
          missions: {
            where: { status: "PUBLISHED" as const },
            include: {
              translations: { where: { locale: ES } },
              successConditions: {
                orderBy: { order: "asc" as const },
                include: { translations: { where: { locale: ES } } },
              },
              evaluationCriteria: {
                orderBy: { order: "asc" as const },
                include: { translations: { where: { locale: ES } } },
              },
            },
          },
          dialogues: {
            where: { status: "PUBLISHED" as const },
            include: {
              translations: { where: { locale: ES } },
              speakers: {
                orderBy: { order: "asc" as const },
                include: { translations: { where: { locale: ES } } },
              },
              lines: {
                orderBy: { order: "asc" as const },
                include: { translations: { where: { locale: ES } } },
              },
            },
          },
          vocabulary: {
            orderBy: { order: "asc" as const },
            include: {
              vocabularyItem: {
                include: {
                  translations: { where: { locale: ES } },
                  examples: {
                    orderBy: { order: "asc" as const },
                    include: { translations: { where: { locale: ES } } },
                  },
                },
              },
            },
          },
          grammarPoints: {
            orderBy: { order: "asc" as const },
            include: {
              grammarPoint: {
                include: {
                  translations: { where: { locale: ES } },
                  examples: {
                    orderBy: { order: "asc" as const },
                    include: { translations: { where: { locale: ES } } },
                  },
                },
              },
            },
          },
          exercises: {
            where: { status: "PUBLISHED" as const },
            orderBy: { order: "asc" as const },
            include: {
              translations: { where: { locale: ES } },
              options: {
                orderBy: { order: "asc" as const },
                include: { translations: { where: { locale: ES } } },
              },
              hints: {
                orderBy: { level: "asc" as const },
                include: { translations: { where: { locale: ES } } },
              },
            },
          },
          quizzes: {
            where: { status: "PUBLISHED" as const },
            include: {
              translations: { where: { locale: ES } },
              questions: {
                orderBy: { order: "asc" as const },
                include: {
                  translations: { where: { locale: ES } },
                  options: {
                    orderBy: { order: "asc" as const },
                    include: { translations: { where: { locale: ES } } },
                  },
                },
              },
            },
          },
          writingTasks: {
            where: { status: "PUBLISHED" as const },
            include: { translations: { where: { locale: ES } } },
          },
        },
      },
    },
  },
} satisfies Prisma.ScenarioInclude;

type ScenarioBundle = Prisma.ScenarioGetPayload<{
  include: typeof scenarioInclude;
}>;

function key(entityType: string, entityId: string, field: string) {
  return `${entityType}:${entityId}:${field}`;
}

function addUnit(
  units: Map<string, CurriculumTranslationUnit>,
  input: {
    entityType: string;
    entityId: string;
    field: string;
    context: string;
    source: string | null | undefined;
    translation: string | null | undefined;
  },
) {
  if (!input.source?.trim()) return;
  const unitKey = key(input.entityType, input.entityId, input.field);
  if (units.has(unitKey)) return;
  units.set(unitKey, {
    key: unitKey,
    entityType: input.entityType,
    entityId: input.entityId,
    field: input.field,
    context: input.context,
    source: input.source,
    translation: input.translation ?? "",
  });
}

function addMissionUnits(
  units: Map<string, CurriculumTranslationUnit>,
  mission: ScenarioBundle["missions"][number],
  context: string,
) {
  const translated = mission.translations[0];
  for (const field of [
    "title",
    "context",
    "objective",
    "learnerRole",
    "aiRole",
  ] as const) {
    addUnit(units, {
      entityType: "mission",
      entityId: mission.id,
      field,
      context,
      source: mission[field],
      translation: translated?.[field],
    });
  }
  for (const condition of mission.successConditions) {
    addUnit(units, {
      entityType: "missionSuccessCondition",
      entityId: condition.id,
      field: "description",
      context: `${context} · success condition`,
      source: condition.description,
      translation: condition.translations[0]?.description,
    });
  }
  for (const criterion of mission.evaluationCriteria) {
    for (const field of ["name", "description"] as const) {
      addUnit(units, {
        entityType: "missionEvaluationCriterion",
        entityId: criterion.id,
        field,
        context: `${context} · evaluation criterion`,
        source: criterion[field],
        translation: criterion.translations[0]?.[field],
      });
    }
  }
}

function extractUnits(scenario: ScenarioBundle) {
  const units = new Map<string, CurriculumTranslationUnit>();
  const scenarioContext = `Scenario: ${scenario.name}`;
  const domainTranslation = scenario.domain.translations[0];
  for (const field of ["name", "description"] as const) {
    addUnit(units, {
      entityType: "domain",
      entityId: scenario.domain.id,
      field,
      context: `Domain containing ${scenario.name}`,
      source: scenario.domain[field],
      translation: domainTranslation?.[field],
    });
  }

  const scenarioTranslation = scenario.translations[0];
  for (const field of ["name", "description", "context"] as const) {
    addUnit(units, {
      entityType: "scenario",
      entityId: scenario.id,
      field,
      context: scenarioContext,
      source: scenario[field],
      translation: scenarioTranslation?.[field],
    });
  }
  scenario.communicationOutcomes.forEach((source, index) =>
    addUnit(units, {
      entityType: "scenario",
      entityId: scenario.id,
      field: `communicationOutcomes.${index}`,
      context: `${scenarioContext} · communication outcome`,
      source,
      translation: scenarioTranslation?.communicationOutcomes[index],
    }),
  );
  for (const objective of scenario.learningObjectives) {
    addUnit(units, {
      entityType: "learningObjective",
      entityId: objective.id,
      field: "description",
      context: `${scenarioContext} · learning objective`,
      source: objective.description,
      translation: objective.translations[0]?.description,
    });
  }
  for (const mission of scenario.missions) {
    addMissionUnits(units, mission, `${scenarioContext} · scenario mission`);
  }
  for (const task of scenario.writingTasks) {
    const translated = task.translations[0];
    for (const field of ["title", "prompt"] as const) {
      addUnit(units, {
        entityType: "writingTask",
        entityId: task.id,
        field,
        context: `${scenarioContext} · writing task`,
        source: task[field],
        translation: translated?.[field],
      });
    }
  }

  for (const level of scenario.levels) {
    for (const lesson of level.lessons) {
      const lessonContext = `${scenarioContext} · Lesson: ${lesson.title}`;
      const lessonTranslation = lesson.translations[0];
      for (const field of ["title", "communicationObjective"] as const) {
        addUnit(units, {
          entityType: "lesson",
          entityId: lesson.id,
          field,
          context: lessonContext,
          source: lesson[field],
          translation: lessonTranslation?.[field],
        });
      }
      for (const step of lesson.steps) {
        addUnit(units, {
          entityType: "lessonStep",
          entityId: step.id,
          field: "title",
          context: `${lessonContext} · ${step.type} step`,
          source: step.title,
          translation: step.translations[0]?.title,
        });
      }
      for (const objective of lesson.learningObjectives) {
        addUnit(units, {
          entityType: "learningObjective",
          entityId: objective.id,
          field: "description",
          context: `${lessonContext} · learning objective`,
          source: objective.description,
          translation: objective.translations[0]?.description,
        });
      }
      for (const mission of lesson.missions) {
        addMissionUnits(units, mission, `${lessonContext} · mission`);
      }
      for (const dialogue of lesson.dialogues) {
        const translated = dialogue.translations[0];
        for (const field of [
          "title",
          "communicationObjective",
          "contextDescription",
        ] as const) {
          addUnit(units, {
            entityType: "dialogue",
            entityId: dialogue.id,
            field,
            context: `${lessonContext} · dialogue`,
            source: dialogue[field],
            translation: translated?.[field],
          });
        }
        for (const speaker of dialogue.speakers) {
          addUnit(units, {
            entityType: "dialogueSpeaker",
            entityId: speaker.id,
            field: "role",
            context: `${lessonContext} · dialogue speaker ${speaker.name}`,
            source: speaker.role,
            translation: speaker.translations[0]?.role,
          });
        }
        for (const line of dialogue.lines) {
          addUnit(units, {
            entityType: "dialogueLine",
            entityId: line.id,
            field: "translation",
            context: `${lessonContext} · dialogue line ${line.order}`,
            source: line.translation,
            translation: line.translations[0]?.translation,
          });
        }
      }
      for (const linked of lesson.vocabulary) {
        const item = linked.vocabularyItem;
        const translated = item.translations[0];
        for (const field of ["meaning", "partOfSpeech"] as const) {
          addUnit(units, {
            entityType: "vocabularyItem",
            entityId: item.id,
            field,
            context: `${lessonContext} · vocabulary ${item.chineseForm} (${item.pinyin})`,
            source: item[field],
            translation: translated?.[field],
          });
        }
        for (const example of item.examples) {
          addUnit(units, {
            entityType: "vocabularyExample",
            entityId: example.id,
            field: "translation",
            context: `${lessonContext} · example for ${item.chineseForm} (${item.pinyin})`,
            source: example.translation,
            translation: example.translations[0]?.translation,
          });
        }
      }
      for (const linked of lesson.grammarPoints) {
        const point = linked.grammarPoint;
        const translated = point.translations[0];
        for (const field of [
          "name",
          "communicationPurpose",
          "explanation",
          "commonMistake",
        ] as const) {
          addUnit(units, {
            entityType: "grammarPoint",
            entityId: point.id,
            field,
            context: `${lessonContext} · grammar (${point.structure})`,
            source: point[field],
            translation: translated?.[field],
          });
        }
        for (const example of point.examples) {
          addUnit(units, {
            entityType: "grammarExample",
            entityId: example.id,
            field: "translation",
            context: `${lessonContext} · grammar example (${point.structure})`,
            source: example.translation,
            translation: example.translations[0]?.translation,
          });
        }
      }
      for (const exercise of lesson.exercises) {
        const translated = exercise.translations[0];
        for (const field of ["prompt", "explanation"] as const) {
          addUnit(units, {
            entityType: "exercise",
            entityId: exercise.id,
            field,
            context: `${lessonContext} · ${exercise.type} exercise`,
            source: exercise[field],
            translation: translated?.[field],
          });
        }
        for (const option of exercise.options) {
          addUnit(units, {
            entityType: "exerciseOption",
            entityId: option.id,
            field: "content",
            context: `${lessonContext} · exercise option`,
            source: option.content,
            translation: option.translations[0]?.content,
          });
        }
        for (const hint of exercise.hints) {
          addUnit(units, {
            entityType: "exerciseHint",
            entityId: hint.id,
            field: "text",
            context: `${lessonContext} · exercise hint level ${hint.level}`,
            source: hint.text,
            translation: hint.translations[0]?.text,
          });
        }
      }
      for (const quiz of lesson.quizzes) {
        addUnit(units, {
          entityType: "quiz",
          entityId: quiz.id,
          field: "title",
          context: `${lessonContext} · quiz`,
          source: quiz.title,
          translation: quiz.translations[0]?.title,
        });
        for (const question of quiz.questions) {
          const translated = question.translations[0];
          for (const field of ["prompt", "explanation"] as const) {
            addUnit(units, {
              entityType: "quizQuestion",
              entityId: question.id,
              field,
              context: `${lessonContext} · quiz question`,
              source: question[field],
              translation: translated?.[field],
            });
          }
          for (const option of question.options) {
            addUnit(units, {
              entityType: "quizQuestionOption",
              entityId: option.id,
              field: "content",
              context: `${lessonContext} · quiz option`,
              source: option.content,
              translation: option.translations[0]?.content,
            });
          }
        }
      }
      for (const task of lesson.writingTasks) {
        const translated = task.translations[0];
        for (const field of ["title", "prompt"] as const) {
          addUnit(units, {
            entityType: "writingTask",
            entityId: task.id,
            field,
            context: `${lessonContext} · writing task`,
            source: task[field],
            translation: translated?.[field],
          });
        }
      }
    }
  }
  return [...units.values()];
}

async function findScenario(database: PrismaClient, slug?: string) {
  if (slug) {
    return database.scenario.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: scenarioInclude,
    });
  }
  return database.scenario.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: [{ domain: { order: "asc" } }, { order: "asc" }],
    include: scenarioInclude,
  });
}

function translationPackageFor(
  scenario: ScenarioBundle,
): CurriculumTranslationPackage {
  const units = extractUnits(scenario);
  return {
    schemaVersion: 1,
    targetLocale: "es",
    generatedAt: new Date().toISOString(),
    scenario: {
      id: scenario.id,
      slug: scenario.slug,
      sourceName: scenario.name,
    },
    sourceHash: curriculumTranslationSourceHash(units),
    translationBaselineHash: curriculumTranslationBaselineHash(units),
    instructions: [
      "Edit only each unit.translation value. Never edit source, key, IDs, fields, context, hashes, or structure.",
      "Use natural, concise neutral Latin American Spanish suitable for a Mandarin learner.",
      "Preserve every Chinese fragment, pinyin, placeholder, URL, brand name, HSK label, and HanGo product name exactly.",
      "Translate pedagogical meaning, not Mandarin answers. Do not add explanations or facts absent from source.",
      "Complete every translation. Return valid JSON only, with the same unit order.",
    ],
    units,
  };
}

function value(
  values: Map<string, string>,
  entityType: string,
  id: string,
  field: string,
) {
  const translated = values.get(key(entityType, id, field));
  if (!translated)
    throw new Error(
      `Missing validated translation: ${key(entityType, id, field)}`,
    );
  return translated;
}

function optionalValue(
  values: Map<string, string>,
  entityType: string,
  id: string,
  field: string,
  source: string | null,
) {
  return source ? value(values, entityType, id, field) : null;
}

async function applyMission(
  tx: Prisma.TransactionClient,
  values: Map<string, string>,
  mission: ScenarioBundle["missions"][number],
) {
  const data = {
    locale: ES,
    title: value(values, "mission", mission.id, "title"),
    context: optionalValue(
      values,
      "mission",
      mission.id,
      "context",
      mission.context,
    ),
    objective: value(values, "mission", mission.id, "objective"),
    learnerRole: optionalValue(
      values,
      "mission",
      mission.id,
      "learnerRole",
      mission.learnerRole,
    ),
    aiRole: optionalValue(
      values,
      "mission",
      mission.id,
      "aiRole",
      mission.aiRole,
    ),
  };
  await tx.missionTranslation.upsert({
    where: { missionId_locale: { missionId: mission.id, locale: ES } },
    create: { missionId: mission.id, ...data },
    update: data,
  });
  for (const condition of mission.successConditions) {
    const conditionData = {
      locale: ES,
      description: value(
        values,
        "missionSuccessCondition",
        condition.id,
        "description",
      ),
    };
    await tx.missionSuccessConditionTranslation.upsert({
      where: {
        missionSuccessConditionId_locale: {
          missionSuccessConditionId: condition.id,
          locale: ES,
        },
      },
      create: { missionSuccessConditionId: condition.id, ...conditionData },
      update: conditionData,
    });
  }
  for (const criterion of mission.evaluationCriteria) {
    const criterionData = {
      locale: ES,
      name: value(values, "missionEvaluationCriterion", criterion.id, "name"),
      description: optionalValue(
        values,
        "missionEvaluationCriterion",
        criterion.id,
        "description",
        criterion.description,
      ),
    };
    await tx.missionEvaluationCriterionTranslation.upsert({
      where: {
        missionEvaluationCriterionId_locale: {
          missionEvaluationCriterionId: criterion.id,
          locale: ES,
        },
      },
      create: { missionEvaluationCriterionId: criterion.id, ...criterionData },
      update: criterionData,
    });
  }
}

async function applyWritingTask(
  tx: Prisma.TransactionClient,
  values: Map<string, string>,
  task: ScenarioBundle["writingTasks"][number],
) {
  const data = {
    locale: ES,
    title: value(values, "writingTask", task.id, "title"),
    prompt: value(values, "writingTask", task.id, "prompt"),
  };
  await tx.writingTaskTranslation.upsert({
    where: { writingTaskId_locale: { writingTaskId: task.id, locale: ES } },
    create: { writingTaskId: task.id, ...data },
    update: data,
  });
}

async function applyPackage(
  database: PrismaClient,
  scenario: ScenarioBundle,
  translationPackage: CurriculumTranslationPackage,
) {
  const values = translationValueMap(translationPackage);
  await database.$transaction(
    async (tx) => {
      const domainData = {
        locale: ES,
        name: value(values, "domain", scenario.domain.id, "name"),
        description: optionalValue(
          values,
          "domain",
          scenario.domain.id,
          "description",
          scenario.domain.description,
        ),
      };
      await tx.domainTranslation.upsert({
        where: {
          domainId_locale: { domainId: scenario.domain.id, locale: ES },
        },
        create: { domainId: scenario.domain.id, ...domainData },
        update: domainData,
      });

      const scenarioData = {
        locale: ES,
        name: value(values, "scenario", scenario.id, "name"),
        description: optionalValue(
          values,
          "scenario",
          scenario.id,
          "description",
          scenario.description,
        ),
        context: optionalValue(
          values,
          "scenario",
          scenario.id,
          "context",
          scenario.context,
        ),
        communicationOutcomes: scenario.communicationOutcomes.map((_, index) =>
          value(
            values,
            "scenario",
            scenario.id,
            `communicationOutcomes.${index}`,
          ),
        ),
      };
      await tx.scenarioTranslation.upsert({
        where: { scenarioId_locale: { scenarioId: scenario.id, locale: ES } },
        create: { scenarioId: scenario.id, ...scenarioData },
        update: scenarioData,
      });

      for (const objective of scenario.learningObjectives) {
        const data = {
          locale: ES,
          description: value(
            values,
            "learningObjective",
            objective.id,
            "description",
          ),
        };
        await tx.learningObjectiveTranslation.upsert({
          where: {
            learningObjectiveId_locale: {
              learningObjectiveId: objective.id,
              locale: ES,
            },
          },
          create: { learningObjectiveId: objective.id, ...data },
          update: data,
        });
      }
      for (const mission of scenario.missions)
        await applyMission(tx, values, mission);
      for (const task of scenario.writingTasks)
        await applyWritingTask(tx, values, task);

      for (const level of scenario.levels) {
        for (const lesson of level.lessons) {
          const lessonData = {
            locale: ES,
            title: value(values, "lesson", lesson.id, "title"),
            communicationObjective: value(
              values,
              "lesson",
              lesson.id,
              "communicationObjective",
            ),
          };
          await tx.lessonTranslation.upsert({
            where: { lessonId_locale: { lessonId: lesson.id, locale: ES } },
            create: { lessonId: lesson.id, ...lessonData },
            update: lessonData,
          });
          for (const step of lesson.steps) {
            const data = {
              locale: ES,
              title: optionalValue(
                values,
                "lessonStep",
                step.id,
                "title",
                step.title,
              ),
            };
            await tx.lessonStepTranslation.upsert({
              where: {
                lessonStepId_locale: { lessonStepId: step.id, locale: ES },
              },
              create: { lessonStepId: step.id, ...data },
              update: data,
            });
          }
          for (const objective of lesson.learningObjectives) {
            const data = {
              locale: ES,
              description: value(
                values,
                "learningObjective",
                objective.id,
                "description",
              ),
            };
            await tx.learningObjectiveTranslation.upsert({
              where: {
                learningObjectiveId_locale: {
                  learningObjectiveId: objective.id,
                  locale: ES,
                },
              },
              create: { learningObjectiveId: objective.id, ...data },
              update: data,
            });
          }
          for (const mission of lesson.missions)
            await applyMission(tx, values, mission);
          for (const dialogue of lesson.dialogues) {
            const data = {
              locale: ES,
              title: value(values, "dialogue", dialogue.id, "title"),
              communicationObjective: optionalValue(
                values,
                "dialogue",
                dialogue.id,
                "communicationObjective",
                dialogue.communicationObjective,
              ),
              contextDescription: optionalValue(
                values,
                "dialogue",
                dialogue.id,
                "contextDescription",
                dialogue.contextDescription,
              ),
            };
            await tx.dialogueTranslation.upsert({
              where: {
                dialogueId_locale: { dialogueId: dialogue.id, locale: ES },
              },
              create: { dialogueId: dialogue.id, ...data },
              update: data,
            });
            for (const speaker of dialogue.speakers) {
              const speakerData = {
                locale: ES,
                role: optionalValue(
                  values,
                  "dialogueSpeaker",
                  speaker.id,
                  "role",
                  speaker.role,
                ),
              };
              await tx.dialogueSpeakerTranslation.upsert({
                where: {
                  dialogueSpeakerId_locale: {
                    dialogueSpeakerId: speaker.id,
                    locale: ES,
                  },
                },
                create: { dialogueSpeakerId: speaker.id, ...speakerData },
                update: speakerData,
              });
            }
            for (const line of dialogue.lines) {
              const lineData = {
                locale: ES,
                translation: value(
                  values,
                  "dialogueLine",
                  line.id,
                  "translation",
                ),
              };
              await tx.dialogueLineTranslation.upsert({
                where: {
                  dialogueLineId_locale: {
                    dialogueLineId: line.id,
                    locale: ES,
                  },
                },
                create: { dialogueLineId: line.id, ...lineData },
                update: lineData,
              });
            }
          }
          for (const linked of lesson.vocabulary) {
            const item = linked.vocabularyItem;
            const data = {
              locale: ES,
              meaning: value(values, "vocabularyItem", item.id, "meaning"),
              partOfSpeech: optionalValue(
                values,
                "vocabularyItem",
                item.id,
                "partOfSpeech",
                item.partOfSpeech,
              ),
            };
            await tx.vocabularyItemTranslation.upsert({
              where: {
                vocabularyItemId_locale: {
                  vocabularyItemId: item.id,
                  locale: ES,
                },
              },
              create: { vocabularyItemId: item.id, ...data },
              update: data,
            });
            for (const example of item.examples) {
              const exampleData = {
                locale: ES,
                translation: value(
                  values,
                  "vocabularyExample",
                  example.id,
                  "translation",
                ),
              };
              await tx.vocabularyExampleTranslation.upsert({
                where: {
                  vocabularyExampleId_locale: {
                    vocabularyExampleId: example.id,
                    locale: ES,
                  },
                },
                create: { vocabularyExampleId: example.id, ...exampleData },
                update: exampleData,
              });
            }
          }
          for (const linked of lesson.grammarPoints) {
            const point = linked.grammarPoint;
            const data = {
              locale: ES,
              name: value(values, "grammarPoint", point.id, "name"),
              communicationPurpose: optionalValue(
                values,
                "grammarPoint",
                point.id,
                "communicationPurpose",
                point.communicationPurpose,
              ),
              explanation: value(
                values,
                "grammarPoint",
                point.id,
                "explanation",
              ),
              commonMistake: optionalValue(
                values,
                "grammarPoint",
                point.id,
                "commonMistake",
                point.commonMistake,
              ),
            };
            await tx.grammarPointTranslation.upsert({
              where: {
                grammarPointId_locale: { grammarPointId: point.id, locale: ES },
              },
              create: { grammarPointId: point.id, ...data },
              update: data,
            });
            for (const example of point.examples) {
              const exampleData = {
                locale: ES,
                translation: value(
                  values,
                  "grammarExample",
                  example.id,
                  "translation",
                ),
              };
              await tx.grammarExampleTranslation.upsert({
                where: {
                  grammarExampleId_locale: {
                    grammarExampleId: example.id,
                    locale: ES,
                  },
                },
                create: { grammarExampleId: example.id, ...exampleData },
                update: exampleData,
              });
            }
          }
          for (const exercise of lesson.exercises) {
            const data = {
              locale: ES,
              prompt: value(values, "exercise", exercise.id, "prompt"),
              explanation: optionalValue(
                values,
                "exercise",
                exercise.id,
                "explanation",
                exercise.explanation,
              ),
            };
            await tx.exerciseTranslation.upsert({
              where: {
                exerciseId_locale: { exerciseId: exercise.id, locale: ES },
              },
              create: { exerciseId: exercise.id, ...data },
              update: data,
            });
            for (const option of exercise.options) {
              const optionData = {
                locale: ES,
                content: value(values, "exerciseOption", option.id, "content"),
              };
              await tx.exerciseOptionTranslation.upsert({
                where: {
                  exerciseOptionId_locale: {
                    exerciseOptionId: option.id,
                    locale: ES,
                  },
                },
                create: { exerciseOptionId: option.id, ...optionData },
                update: optionData,
              });
            }
            for (const hint of exercise.hints) {
              const hintData = {
                locale: ES,
                text: value(values, "exerciseHint", hint.id, "text"),
              };
              await tx.exerciseHintTranslation.upsert({
                where: {
                  exerciseHintId_locale: {
                    exerciseHintId: hint.id,
                    locale: ES,
                  },
                },
                create: { exerciseHintId: hint.id, ...hintData },
                update: hintData,
              });
            }
          }
          for (const quiz of lesson.quizzes) {
            const quizData = {
              locale: ES,
              title: value(values, "quiz", quiz.id, "title"),
            };
            await tx.quizTranslation.upsert({
              where: { quizId_locale: { quizId: quiz.id, locale: ES } },
              create: { quizId: quiz.id, ...quizData },
              update: quizData,
            });
            for (const question of quiz.questions) {
              const questionData = {
                locale: ES,
                prompt: value(values, "quizQuestion", question.id, "prompt"),
                explanation: optionalValue(
                  values,
                  "quizQuestion",
                  question.id,
                  "explanation",
                  question.explanation,
                ),
              };
              await tx.quizQuestionTranslation.upsert({
                where: {
                  quizQuestionId_locale: {
                    quizQuestionId: question.id,
                    locale: ES,
                  },
                },
                create: { quizQuestionId: question.id, ...questionData },
                update: questionData,
              });
              for (const option of question.options) {
                const optionData = {
                  locale: ES,
                  content: value(
                    values,
                    "quizQuestionOption",
                    option.id,
                    "content",
                  ),
                };
                await tx.quizQuestionOptionTranslation.upsert({
                  where: {
                    quizQuestionOptionId_locale: {
                      quizQuestionOptionId: option.id,
                      locale: ES,
                    },
                  },
                  create: { quizQuestionOptionId: option.id, ...optionData },
                  update: optionData,
                });
              }
            }
          }
          for (const task of lesson.writingTasks)
            await applyWritingTask(tx, values, task);
        }
      }
    },
    // A scenario can contain hundreds of normalized translation rows. Keep
    // the import atomic, but allow enough time for sequential upserts against
    // a remote database rather than expiring halfway through a valid package.
    { timeout: IMPORT_TRANSACTION_TIMEOUT_MS },
  );
}

function argumentAfter(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const command = process.argv[2];
  if (!command || !["export", "validate", "import"].includes(command)) {
    throw new Error(
      "Usage: npm run content:i18n:exchange -- export [scenario-slug] [--out file] | validate file | import file [--apply]",
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString)
    throw new Error("DATABASE_URL is required in .env.local.");
  const database = new PrismaClient({
    adapter: new PrismaPg({ connectionString, max: 2 }),
  });

  try {
    if (command === "export") {
      const positionalSlug = process.argv[3]?.startsWith("--")
        ? undefined
        : process.argv[3];
      const scenario = await findScenario(database, positionalSlug);
      if (!scenario)
        throw new Error(
          `Published scenario not found: ${positionalSlug ?? "first"}`,
        );
      const translationPackage = translationPackageFor(scenario);
      const outputPath = resolve(
        argumentAfter("--out") ??
          `project/curriculum-translations/es/${scenario.slug}.json`,
      );
      if (!process.argv.includes("--force")) {
        try {
          await access(outputPath);
          throw new Error(
            `Refusing to overwrite existing file: ${outputPath}. Use --force explicitly.`,
          );
        } catch (error) {
          if (error instanceof Error && error.message.startsWith("Refusing"))
            throw error;
        }
      }
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(
        outputPath,
        `${JSON.stringify(translationPackage, null, 2)}\n`,
        "utf8",
      );
      const alreadyTranslated = translationPackage.units.filter((unit) =>
        unit.translation.trim(),
      ).length;
      console.log(`Exported: ${scenario.name} (${scenario.slug})`);
      console.log(`File: ${outputPath}`);
      console.log(
        `Units: ${translationPackage.units.length}; already translated: ${alreadyTranslated}`,
      );
      return;
    }

    const inputPath = process.argv[3];
    if (!inputPath) throw new Error(`${command} requires a JSON file path.`);
    const raw = JSON.parse(
      await readFile(resolve(inputPath), "utf8"),
    ) as unknown;
    const validation = validateCurriculumTranslationPackage(raw, {
      requireComplete: command === "import",
    });
    if (!validation.valid) {
      console.error(validation.errors.slice(0, 50).join("\n"));
      if (validation.errors.length > 50)
        console.error(`...and ${validation.errors.length - 50} more errors.`);
      process.exitCode = 1;
      return;
    }
    const translationPackage = curriculumTranslationPackageSchema.parse(raw);
    console.log(`Valid package: ${translationPackage.scenario.sourceName}`);
    console.log(`Units: ${translationPackage.units.length}`);
    if (command === "validate") return;

    const scenario = await findScenario(
      database,
      translationPackage.scenario.slug,
    );
    if (!scenario || scenario.id !== translationPackage.scenario.id) {
      throw new Error("The scenario no longer matches the exported package.");
    }
    const current = translationPackageFor(scenario);
    if (current.sourceHash !== translationPackage.sourceHash) {
      throw new Error(
        "Curriculum source changed after export. Export a fresh package before importing.",
      );
    }
    if (
      current.translationBaselineHash !==
      translationPackage.translationBaselineHash
    ) {
      const conflicts = conflictingCurrentTranslationKeys(
        current,
        translationPackage,
      );
      if (conflicts.length > 0) {
        const conflictSummary = conflicts.length
          ? ` Conflicting keys: ${conflicts.slice(0, 5).join(", ")}.`
          : "";
        throw new Error(
          `Spanish translations changed after export. Export a fresh package to avoid overwriting concurrent work.${conflictSummary}`,
        );
      }
      console.log(
        "Translation baseline advanced only through matching shared rows; continuing safely.",
      );
    }
    if (!process.argv.includes("--apply")) {
      console.log(
        "Dry run only: all checks passed. Add --apply to import atomically.",
      );
      return;
    }
    await applyPackage(database, scenario, translationPackage);
    console.log("Spanish translations imported atomically.");
  } finally {
    await database.$disconnect();
  }
}

void main();
