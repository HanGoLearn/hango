// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// "use server" action pulling in auth/db (-> Prisma) - jsdom can't resolve
// that chain the way Next's bundler does, same reasoning as every other
// mocked action in shell.test.tsx.
vi.mock("@/lib/actions/vocabulary-lookup", () => ({
  lookupVocabularyWordAction: vi.fn(),
}));

import { lookupVocabularyWordAction } from "@/lib/actions/vocabulary-lookup";
import { WordsOfTheDayCard } from "@/components/dashboard/words-of-the-day-card";
import type { VocabularyLookupResult } from "@/lib/vocabulary-lookup-prompt";
import { messages as englishMessages } from "@/i18n/messages/en";
import { messages as spanishMessages } from "@/i18n/messages/es";

afterEach(cleanup);

const WORDS = [
  { chineseForm: "要", pinyin: "yào", meaning: "to want" },
  { chineseForm: "喝", pinyin: "hē", meaning: "to drink" },
  { chineseForm: "水", pinyin: "shuǐ", meaning: "water" },
];

const RESULT: VocabularyLookupResult = {
  hero: { emoji: "🈶", title: "要", subtitle: "yào — to want" },
  frequencyTier: "very common",
  explanation: "Used to say you want something.",
  examples: [
    {
      emoji: "☕",
      chinese: "我要水。",
      pinyin: "Wǒ yào shuǐ.",
      translation: "I want water.",
    },
  ],
  related: [],
  mistakes: null,
  chineseGloss: null,
  curiosity: null,
};

const ENGLISH_PROPS = {
  messages: englishMessages.dashboard.words,
  vocabularyMessages: englishMessages.hanVocabulary,
};

describe("WordsOfTheDayCard", () => {
  it("renders nothing when there are no words", () => {
    const { container } = render(
      <WordsOfTheDayCard words={[]} {...ENGLISH_PROPS} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows all 3 words as tappable chips, with the modal closed by default", () => {
    render(<WordsOfTheDayCard words={WORDS} {...ENGLISH_PROPS} />);
    expect(screen.getByText("要")).toBeInTheDocument();
    expect(screen.getByText("喝")).toBeInTheDocument();
    expect(screen.getByText("水")).toBeInTheDocument();
    expect(screen.queryByText(/Looking up/)).not.toBeInTheDocument();
  });

  it("renders its interface labels in Spanish when translated messages are supplied", async () => {
    vi.mocked(lookupVocabularyWordAction).mockImplementationOnce(
      () => new Promise(() => undefined),
    );
    render(
      <WordsOfTheDayCard
        words={WORDS}
        messages={spanishMessages.dashboard.words}
        vocabularyMessages={spanishMessages.hanVocabulary}
      />,
    );

    expect(screen.getByText("Palabras para ti hoy")).toBeInTheDocument();
    await userEvent.click(screen.getByText("要"));
    expect(screen.getByText("Buscando 要...")).toBeInTheDocument();
  });

  it("localizes the result card chrome without rewriting generated content", async () => {
    vi.mocked(lookupVocabularyWordAction).mockResolvedValueOnce({
      ok: true,
      result: RESULT,
    });
    render(
      <WordsOfTheDayCard
        words={WORDS}
        messages={spanishMessages.dashboard.words}
        vocabularyMessages={spanishMessages.hanVocabulary}
      />,
    );

    await userEvent.click(screen.getByText("要"));

    expect(await screen.findByText("💡 Explicación")).toBeInTheDocument();
    expect(screen.getByText("📋 Ejemplos")).toBeInTheDocument();
    expect(screen.getByText("⭐ Palabra muy frecuente")).toBeInTheDocument();
    expect(
      screen.getByText("Used to say you want something."),
    ).toBeInTheDocument();
  });

  it("tapping a word opens the modal, looks it up, and shows the full card", async () => {
    vi.mocked(lookupVocabularyWordAction).mockResolvedValueOnce({
      ok: true,
      result: RESULT,
    });

    render(<WordsOfTheDayCard words={WORDS} {...ENGLISH_PROPS} />);
    await userEvent.click(screen.getByText("要"));

    expect(lookupVocabularyWordAction).toHaveBeenCalledWith("要");
    expect(
      await screen.findByText("Used to say you want something."),
    ).toBeInTheDocument();
  });

  it("shows a friendly error inside the modal when the lookup fails", async () => {
    vi.mocked(lookupVocabularyWordAction).mockResolvedValueOnce({
      ok: false,
      error: "Han couldn't find that word.",
    });

    render(<WordsOfTheDayCard words={WORDS} {...ENGLISH_PROPS} />);
    await userEvent.click(screen.getByText("喝"));

    expect(
      await screen.findByText("Han couldn't find that word."),
    ).toBeInTheDocument();
  });

  it("resets state after closing, so a different word never shows a stale result", async () => {
    vi.mocked(lookupVocabularyWordAction).mockResolvedValueOnce({
      ok: true,
      result: RESULT,
    });
    render(<WordsOfTheDayCard words={WORDS} {...ENGLISH_PROPS} />);

    await userEvent.click(screen.getByText("要"));
    expect(
      await screen.findByText("Used to say you want something."),
    ).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(
      screen.queryByText("Used to say you want something."),
    ).not.toBeInTheDocument();

    vi.mocked(lookupVocabularyWordAction).mockResolvedValueOnce({
      ok: false,
      error: "Han couldn't find that word.",
    });
    await userEvent.click(screen.getByText("喝"));

    expect(
      await screen.findByText("Han couldn't find that word."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Used to say you want something."),
    ).not.toBeInTheDocument();
  });
});
