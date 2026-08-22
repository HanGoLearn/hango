/**
 * Answer shapes per `ExerciseType` (7.1/7.2), matching the schema comment on
 * `Exercise.correctAnswer` ("correct option id(s), accepted string list, or
 * correct order array, depending on `type`"). No seed data exists yet for
 * SENTENCE_ORDERING or MATCHING, so these conventions are a documented
 * default, not something confirmed against real content:
 * - MULTIPLE_CHOICE / TRUE_FALSE: learner answer is the selected option id;
 *   correctness comes from `ExerciseOption.isCorrect`, not `correctAnswer`.
 * - FILL_IN_BLANK: `correctAnswer.accepted` is a list of acceptable strings.
 * - SENTENCE_ORDERING: `correctAnswer.order` is the correctly ordered token
 *   list; the tokens themselves. The learner answer is their built order.
 * - MATCHING: pairs come from `ExerciseOption.content` values formatted as
 *   "left :: right" (options_system.md gives MATCHING no dedicated model,
 *   `ExerciseOption` is reused per its own doc comment). The learner answer
 *   is the set of pairs they matched.
 * - SHORT_RESPONSE: no auto-gradable correct answer - always ungraded
 *   (`isCorrect: null`).
 */
export type ExerciseAnswer =
  | { type: "MULTIPLE_CHOICE" | "TRUE_FALSE"; optionId: string }
  | { type: "FILL_IN_BLANK"; text: string }
  | { type: "SENTENCE_ORDERING"; order: string[] }
  | { type: "MATCHING"; pairs: [string, string][] }
  | { type: "SHORT_RESPONSE"; text: string };

export interface OptionForEvaluation {
  id: string;
  content: string;
  isCorrect: boolean;
}

export function parseMatchingPairs(
  options: OptionForEvaluation[],
): [string, string][] {
  return options
    .filter((option) => option.content.includes(" :: "))
    .map((option) => {
      const [left, right] = option.content.split(" :: ");
      return [left!, right!] as [string, string];
    });
}

/** Safe to reveal only after grading - the id of the correct MC/TRUE_FALSE option, if any. */
export function findCorrectOptionId(
  options: OptionForEvaluation[],
): string | null {
  return options.find((option) => option.isCorrect)?.id ?? null;
}

/** Returns null for ungraded answer types (SHORT_RESPONSE). */
export function evaluateAnswer(
  correctAnswer: unknown,
  options: OptionForEvaluation[],
  answer: ExerciseAnswer,
): boolean | null {
  switch (answer.type) {
    case "MULTIPLE_CHOICE":
    case "TRUE_FALSE": {
      const selected = options.find((option) => option.id === answer.optionId);
      return selected?.isCorrect ?? false;
    }
    case "FILL_IN_BLANK": {
      const accepted =
        (correctAnswer as { accepted?: string[] } | null)?.accepted ?? [];
      return accepted.some(
        (value) =>
          value.trim().toLowerCase() === answer.text.trim().toLowerCase(),
      );
    }
    case "SENTENCE_ORDERING": {
      const order = (correctAnswer as { order?: string[] } | null)?.order ?? [];
      return (
        order.length === answer.order.length &&
        order.every((token, index) => token === answer.order[index])
      );
    }
    case "MATCHING": {
      const correctPairs = parseMatchingPairs(options);
      if (correctPairs.length !== answer.pairs.length) return false;
      const correctSet = new Set(correctPairs.map(([l, r]) => `${l}::${r}`));
      return answer.pairs.every(([l, r]) => correctSet.has(`${l}::${r}`));
    }
    case "SHORT_RESPONSE":
      return null;
  }
}

export interface ExerciseSubmitResult {
  isCorrect: boolean | null;
  explanation: string | null;
  /** Safe to reveal post-submit; used to highlight the right MC/TRUE_FALSE option. */
  correctOptionId: string | null;
}

export interface ExerciseSourceItem {
  id: string;
  type: ExerciseAnswer["type"];
  prompt: string;
  correctAnswer: unknown;
  explanation?: string | null;
  options: OptionForEvaluation[];
  hints?: { level: number; text: string }[];
}

export interface ClientExercise {
  id: string;
  type: ExerciseAnswer["type"];
  prompt: string;
  /** MULTIPLE_CHOICE / TRUE_FALSE only. */
  options: { id: string; content: string }[];
  /** SENTENCE_ORDERING only - shuffled, so order alone doesn't leak the answer. */
  tokens: string[];
  /** MATCHING only - both shuffled independently. */
  leftTerms: string[];
  rightTerms: string[];
  hints: { level: number; text: string }[];
}

function defaultShuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/**
 * Strips grading data (`ExerciseOption.isCorrect`, `correctAnswer`) before
 * an exercise is sent to the client - grading only ever happens server-side
 * (`evaluateAnswer` above), so the client should never be able to read the
 * answer out of its own props/bundle.
 */
export function toClientExercise(
  item: ExerciseSourceItem,
  shuffle: <T>(items: T[]) => T[] = defaultShuffle,
): ClientExercise {
  const correctAnswer = item.correctAnswer as { order?: string[] } | null;

  return {
    id: item.id,
    type: item.type,
    prompt: item.prompt,
    options:
      item.type === "MULTIPLE_CHOICE" || item.type === "TRUE_FALSE"
        ? shuffle(item.options.map(({ id, content }) => ({ id, content })))
        : [],
    tokens:
      item.type === "SENTENCE_ORDERING"
        ? shuffle(correctAnswer?.order ?? [])
        : [],
    leftTerms:
      item.type === "MATCHING"
        ? shuffle(parseMatchingPairs(item.options).map(([left]) => left))
        : [],
    rightTerms:
      item.type === "MATCHING"
        ? shuffle(parseMatchingPairs(item.options).map(([, right]) => right))
        : [],
    hints: item.hints ?? [],
  };
}
