import { describe, expect, it } from "vitest";
import {
  contentLanguageForLocale,
  localizeContentRecord,
  selectContentTranslation,
} from "@/lib/content/localization";

describe("curriculum content localization", () => {
  const record = {
    id: "scenario-1",
    name: "Restaurant",
    description: "Order a meal.",
    slug: "restaurant",
    translations: [
      {
        locale: "ES" as const,
        name: "Restaurante",
        description: "Pide una comida.",
      },
    ],
  };

  it("maps app locales to persisted interface-language values", () => {
    expect(contentLanguageForLocale("es")).toBe("ES");
    expect(contentLanguageForLocale("en")).toBe("EN");
  });

  it("selects the requested translation", () => {
    expect(selectContentTranslation(record.translations, "es")?.name).toBe(
      "Restaurante",
    );
  });

  it("retains canonical English fields when a translation is missing", () => {
    expect(
      localizeContentRecord(record, "en", ["name", "description"]),
    ).toEqual({
      id: "scenario-1",
      name: "Restaurant",
      description: "Order a meal.",
      slug: "restaurant",
    });
  });

  it("applies only display fields and never changes structural data", () => {
    expect(
      localizeContentRecord(record, "es", ["name", "description"]),
    ).toEqual({
      id: "scenario-1",
      name: "Restaurante",
      description: "Pide una comida.",
      slug: "restaurant",
    });
  });

  it("falls back to an explicit English row before the base value", () => {
    const translated = {
      ...record,
      translations: [
        {
          locale: "EN" as const,
          name: "Dining out",
          description: null,
        },
      ],
    };

    expect(
      localizeContentRecord(translated, "es", ["name", "description"]),
    ).toMatchObject({
      name: "Dining out",
      description: "Order a meal.",
    });
  });
});
