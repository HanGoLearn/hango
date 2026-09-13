import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localeFromAcceptLanguage,
  localeFromPathname,
  localeAwareHref,
  localePath,
} from "@/i18n/config";
import { messages as englishMessages } from "@/i18n/messages/en";
import { messages as spanishMessages } from "@/i18n/messages/es";
import { formatMessage } from "@/i18n/format";
import { localizeReviewItem } from "@/i18n/review";
import { localizeSettingsValidation } from "@/i18n/settings";
import { localizeAchievement } from "@/i18n/achievements";
import { ACHIEVEMENTS } from "@/lib/achievements-catalog";
import { localizeSpeakingError } from "@/i18n/speaking";
import { localizeWritingError } from "@/i18n/writing";
import { localizeVocabularyError } from "@/i18n/vocabulary";

function keyShape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(keyShape);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, keyShape(child)]),
    );
  }
  return typeof value;
}

describe("bilingual locale foundation", () => {
  it("supports only Spanish and English, with Spanish as the default", () => {
    expect(DEFAULT_LOCALE).toBe("es");
    expect(isAppLocale("es")).toBe(true);
    expect(isAppLocale("en")).toBe(true);
    expect(isAppLocale("zh")).toBe(false);
  });

  it("builds locale-prefixed paths without duplicating a prior locale", () => {
    expect(localePath("es")).toBe("/es");
    expect(localePath("en", "/login")).toBe("/en/login");
    expect(localePath("es", "/en/reset-password")).toBe("/es/reset-password");
    expect(localeFromPathname("/en/dashboard")).toBe("en");
    expect(localeFromPathname("/dashboard")).toBeNull();
    expect(localeAwareHref("es", "/lesson/hello")).toBe("/es/lesson/hello");
    expect(localeAwareHref("en", "/admin/users")).toBe("/admin/users");
    expect(localeAwareHref("es", "https://example.com")).toBe(
      "https://example.com",
    );
  });

  it("honors browser language quality values and falls back to Spanish", () => {
    expect(localeFromAcceptLanguage("en-US,en;q=0.9,es;q=0.8")).toBe("en");
    expect(localeFromAcceptLanguage("en;q=0.5,es-CO;q=0.9")).toBe("es");
    expect(localeFromAcceptLanguage("fr-FR,fr;q=0.9")).toBe("es");
  });

  it("keeps the English and Spanish dictionaries structurally identical", () => {
    expect(keyShape(spanishMessages)).toEqual(keyShape(englishMessages));
  });

  it("interpolates translated interface messages without losing unknown placeholders", () => {
    expect(
      formatMessage("{completed} de {total} · {pending}", {
        completed: 3,
        total: 8,
      }),
    ).toBe("3 de 8 · {pending}");
  });

  it("localizes structured review copy without changing authored lesson titles", () => {
    const display = localizeReviewItem(
      {
        id: "VOCABULARY:1",
        type: "VOCABULARY",
        itemKey: "1",
        title: "谢谢",
        reason: 'You learned this in "Ordering food"',
        estimatedMinutes: 2,
        actionLabel: "Review",
        actionHref: "/lesson/ordering-food",
        sourceLessonTitle: "Ordering food",
      },
      spanishMessages.dashboard.review,
    );

    expect(display).toEqual({
      title: "谢谢",
      reason: "Lo aprendiste en «Ordering food»",
      actionLabel: "Repasar",
    });
  });

  it("localizes settings validation while retaining English as the compatibility default", () => {
    expect(localizeSettingsValidation("es", "Select at least one goal")).toBe(
      "Selecciona al menos un objetivo",
    );
    expect(localizeSettingsValidation("en", "Select at least one goal")).toBe(
      "Select at least one goal",
    );
  });

  it("has a localized title and description for every achievement", () => {
    for (const achievement of ACHIEVEMENTS) {
      expect(
        localizeAchievement(achievement, spanishMessages.achievements),
      ).toEqual(
        spanishMessages.achievements.items[
          achievement.key as keyof typeof spanishMessages.achievements.items
        ],
      );
    }

    expect(
      localizeAchievement(
        ACHIEVEMENTS.find((item) => item.key === "streak_3")!,
        spanishMessages.achievements,
      ).title,
    ).toBe("Racha de 3 días");
  });

  it("localizes known Speaking Lab errors without rewriting provider details", () => {
    expect(
      localizeSpeakingError(
        "Response is too long (max 2000 characters).",
        spanishMessages.speakingLab.errors,
      ),
    ).toBe("Tu respuesta es demasiado larga (máximo 2000 caracteres).");
    expect(
      localizeSpeakingError(
        "Provider request abc-123 failed",
        spanishMessages.speakingLab.errors,
      ),
    ).toBe("Provider request abc-123 failed");
  });

  it("localizes known Writing Lab errors without rewriting provider details", () => {
    expect(
      localizeWritingError(
        "Response is too long (max 2000 characters).",
        spanishMessages.writingLab.errors,
      ),
    ).toBe("Tu respuesta es demasiado larga (máximo 2000 caracteres).");
    expect(
      localizeWritingError(
        "Provider request writing-123 failed",
        spanishMessages.writingLab.errors,
      ),
    ).toBe("Provider request writing-123 failed");
  });

  it("localizes known Han Vocabulary errors without rewriting provider details", () => {
    expect(
      localizeVocabularyError(
        "That's too long (max 50 characters) - try a single word or short phrase.",
        spanishMessages.hanVocabulary.errors,
      ),
    ).toBe(
      "El texto es demasiado largo (máximo 50 caracteres). Prueba con una sola palabra o una frase corta.",
    );
    expect(
      localizeVocabularyError(
        "Provider request vocabulary-123 failed",
        spanishMessages.hanVocabulary.errors,
      ),
    ).toBe("Provider request vocabulary-123 failed");
  });
});
