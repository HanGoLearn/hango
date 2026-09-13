import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { AppLocale } from "@/i18n/config";
import { localizeContentRecord } from "@/lib/content/localization";

const localizedDialogueInclude = {
  translations: true,
  speakers: {
    orderBy: { order: "asc" as const },
    include: { translations: true },
  },
  lines: {
    orderBy: { order: "asc" as const },
    include: {
      translations: true,
      speaker: { include: { translations: true } },
    },
  },
} satisfies Prisma.DialogueInclude;

type DialogueWithTranslations = Prisma.DialogueGetPayload<{
  include: typeof localizedDialogueInclude;
}>;

function localizeDialogue(
  dialogue: DialogueWithTranslations,
  locale: AppLocale,
) {
  const localized = localizeContentRecord(dialogue, locale, [
    "title",
    "communicationObjective",
    "contextDescription",
  ]);

  return {
    ...localized,
    speakers: localized.speakers.map((speaker) =>
      localizeContentRecord(speaker, locale, ["role"]),
    ),
    lines: localized.lines.map((line) => {
      const localizedLine = localizeContentRecord(line, locale, [
        "translation",
      ]);
      return {
        ...localizedLine,
        speaker: localizeContentRecord(localizedLine.speaker, locale, ["role"]),
      };
    }),
  };
}

export async function getDialoguesForLesson(
  lessonId: string,
  locale: AppLocale = "en",
) {
  const dialogues = await db.dialogue.findMany({
    where: { lessonId, status: "PUBLISHED" },
    include: localizedDialogueInclude,
  });
  return dialogues.map((dialogue) => localizeDialogue(dialogue, locale));
}
