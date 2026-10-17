import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getLessonOptions,
  getLesson,
  getMission,
  getDialogues,
  getVocabulary,
  getGrammar,
} = vi.hoisted(() => ({
  getLessonOptions: vi.fn(),
  getLesson: vi.fn(),
  getMission: vi.fn(),
  getDialogues: vi.fn(),
  getVocabulary: vi.fn(),
  getGrammar: vi.fn(),
}));

vi.mock("@/lib/content/speaking-prompts", () => ({
  getSpeakingLessonOptions: getLessonOptions,
}));

vi.mock("@/lib/content/lesson", () => ({ getLessonBySlug: getLesson }));
vi.mock("@/lib/content/mission", () => ({ getMissionForLesson: getMission }));
vi.mock("@/lib/content/dialogue", () => ({
  getDialoguesForLesson: getDialogues,
}));
vi.mock("@/lib/content/vocabulary", () => ({
  getVocabularyForLesson: getVocabulary,
}));
vi.mock("@/lib/content/grammar", () => ({ getGrammarForLesson: getGrammar }));
import {
  getBetaSpeakingStations,
  getBetaSpeakingStationConversation,
} from "@/lib/beta-speaking-stations";

const options = [
  {
    id: "lesson-intro",
    slug: "foundations-greetings-and-introductions",
    title: "Saludos y presentaciones",
    scenarioTitle: "Primeros pasos",
    scenarioSlug: "getting-started",
    difficulty: "BEGINNER",
    chapter: "BEGINNER",
  },
  {
    id: "lesson-numbers",
    slug: "foundations-numbers-time-and-dates",
    title: "Números, hora y fechas",
    scenarioTitle: "Primeros pasos",
    scenarioSlug: "getting-started",
    difficulty: "BEGINNER",
    chapter: "BEGINNER",
  },
  {
    id: "lesson-prices",
    slug: "basic-shopping-asking-the-price",
    title: "Preguntar el precio",
    scenarioTitle: "Compras básicas",
    scenarioSlug: "basic-shopping",
    difficulty: "BEGINNER",
    chapter: "BEGINNER",
  },
  {
    id: "lesson-extra",
    slug: "family-introducing-your-family",
    title: "Tu familia",
    scenarioTitle: "Familia",
    scenarioSlug: "family",
    difficulty: "BEGINNER",
    chapter: "BEGINNER",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  getLessonOptions.mockResolvedValue(options);
  getLesson.mockResolvedValue({ id: "lesson-intro", hskReference: 1 });
  getMission.mockResolvedValue({
    aiRole: "Un nuevo amigo",
    learnerRole: "Tú",
    context: "Primera presentación",
    objective: "Intercambia nombres",
  });
  getDialogues.mockResolvedValue([
    {
      lines: [
        {
          chineseText: "你好！",
          pinyin: "Nǐ hǎo!",
          translation: "¡Hola!",
          speaker: { name: "小李", role: "Tú" },
        },
      ],
    },
  ]);
  getVocabulary.mockResolvedValue([
    {
      vocabularyItem: {
        chineseForm: "你好",
        pinyin: "Nǐ hǎo",
        meaning: "Hola",
      },
    },
  ]);
  getGrammar.mockResolvedValue([]);
});

describe("beta Speaking Lab station data", () => {
  it("can open a character scene without a prerecorded shadowing dialogue", async () => {
    const station = {
      ...(await getBetaSpeakingStations("en"))[0]!,
    };
    getDialogues.mockResolvedValue([]);
    const conversation = await getBetaSpeakingStationConversation(
      station,
      "en",
    );
    expect(conversation?.rolePlay.objective).toBe("Intercambia nombres");
    expect(conversation?.rolePlay.lessonPhrases).toEqual([]);
  });
  it("uses a localized lesson mission and a language bank, not a shadowing prompt", async () => {
    const station = {
      ...(await getBetaSpeakingStations("es"))[0]!,
    };
    const conversation = await getBetaSpeakingStationConversation(
      station,
      "es",
    );
    expect(getLesson).toHaveBeenCalledWith(station.lessonSlug, "es");
    expect(getMission).toHaveBeenCalledWith(station.lessonId, "es");
    expect(conversation?.rolePlay).toMatchObject({
      objective: "Intercambia nombres",
      lessonHskLevel: 1,
      lessonVocabulary: ["你好"],
      lessonPhrases: ["你好！"],
      correctionMode: "scene",
    });
    expect(conversation?.helpPhrases[0]?.pinyin).toBe("Nǐ hǎo!");
  });

  it("does not substitute shadowing when a mission is missing", async () => {
    const station = (await getBetaSpeakingStations("es"))[0]!;
    getMission.mockResolvedValue(null);
    expect(await getBetaSpeakingStationConversation(station, "es")).toBeNull();
  });
  it("returns all three curated lessons without consulting learner progress", async () => {
    const stations = await getBetaSpeakingStations("es");

    expect(stations.map((station) => station.id)).toEqual([
      "INTRODUCTIONS",
      "NUMBERS_TIME",
      "PRICES",
    ]);
    expect(getLessonOptions).toHaveBeenCalledWith("es");
  });
});
