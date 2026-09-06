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

describe("WordsOfTheDayCard", () => {
  it("renders nothing when there are no words", () => {
    const { container } = render(<WordsOfTheDayCard words={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows all 3 words as tappable chips, with the modal closed by default", () => {
    render(<WordsOfTheDayCard words={WORDS} />);
    expect(screen.getByText("要")).toBeInTheDocument();
    expect(screen.getByText("喝")).toBeInTheDocument();
    expect(screen.getByText("水")).toBeInTheDocument();
    expect(screen.queryByText(/Looking up/)).not.toBeInTheDocument();
  });

  it("tapping a word opens the modal, looks it up, and shows the full card", async () => {
    vi.mocked(lookupVocabularyWordAction).mockResolvedValueOnce({
      ok: true,
      result: RESULT,
    });

    render(<WordsOfTheDayCard words={WORDS} />);
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

    render(<WordsOfTheDayCard words={WORDS} />);
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
    render(<WordsOfTheDayCard words={WORDS} />);

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
