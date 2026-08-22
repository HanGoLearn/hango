import "server-only";
import { db } from "@/lib/db";
import {
  computeCategoryProgress,
  currentGatedLevel,
  currentSkillLevel,
  hasGatedSkillStopped,
  nextGatedQuestionTargets,
  PILOT_MAX_HSK_LEVEL,
  PLACEMENT_SKILLS,
  selectNextCategory,
  type CategoryProgress,
  type PlacementAttemptRecord,
  type PlacementQuestionMeta,
  type PlacementSkillName,
} from "@/lib/placement-exam";
import { createTtlCache } from "@/lib/ttl-cache";

export class PlacementExamNotFoundError extends Error {}

const ADAPTIVE_BLOCK_SKILLS: PlacementSkillName[] = ["VOCABULARY", "GRAMMAR", "READING"];

/** Vocabulary/Grammar use the 2026-08-19 level-gate redesign; Reading/Listening keep the original accumulate-to-mastery mechanism unchanged (see placement-exam.ts's file header for why both coexist). */
const GATED_SKILLS: PlacementSkillName[] = ["VOCABULARY", "GRAMMAR"];

function isGatedSkill(skill: PlacementSkillName): boolean {
  return GATED_SKILLS.includes(skill);
}

/** Dispatches to the right mechanism's "highest level passed" for any of the 4 skills - used both when picking the next question and when finalizing the result. */
function currentLevelForSkill(
  skill: PlacementSkillName,
  progress: CategoryProgress,
  categoriesByLevel: Map<number, string[]>,
): number {
  return isGatedSkill(skill)
    ? currentGatedLevel(progress, skill, categoriesByLevel)
    : currentSkillLevel(progress, skill, categoriesByLevel);
}

/** Whether this skill has nothing left to offer this session - either it reached the ceiling, or (Vocabulary/Grammar only) it permanently stopped after failing a level's gate. */
function isBlockSkillDone(
  skill: PlacementSkillName,
  progress: CategoryProgress,
  categoriesBySkill: Map<PlacementSkillName, Map<number, string[]>>,
): boolean {
  const categoriesByLevel = categoriesBySkill.get(skill) ?? new Map();
  if (isGatedSkill(skill)) {
    return (
      hasGatedSkillStopped(progress, skill, categoriesByLevel) ||
      currentGatedLevel(progress, skill, categoriesByLevel) >= PILOT_MAX_HSK_LEVEL
    );
  }
  return selectNextCategory(progress, skill, categoriesByLevel) === null;
}

/**
 * How many Vocabulary/Grammar questions to batch into one screen/
 * submission (2026-08-19 "agrupar preguntas por pantalla" - project/
 * TASKS.md) - deliberately small, not the whole level, so levelGateStatus
 * (placement-exam.ts) still gets checked *between* batches and the
 * 2026-08-19 early-exit can still stop a struggling learner before their
 * level's full fixed question set is asked. Reading/Listening are
 * unaffected - their own passage/script-based grouping (buildReadingBlockView/
 * buildListeningBlockView) is untouched.
 */
const GATED_BATCH_SIZE = 2;

/** Dispatches to the right mechanism's "what to ask next" for any of the 3 interleaved block skills - a gated skill (Vocabulary/Grammar) may return up to GATED_BATCH_SIZE targets, Reading always returns at most one (its own grouping is by shared passage, handled separately in buildReadingBlockView). */
function nextBlockTargets(
  skill: PlacementSkillName,
  progress: CategoryProgress,
  categoriesBySkill: Map<PlacementSkillName, Map<number, string[]>>,
): { hskLevel: number; category: string }[] {
  const categoriesByLevel = categoriesBySkill.get(skill) ?? new Map();
  if (isGatedSkill(skill)) {
    return nextGatedQuestionTargets(progress, skill, categoriesByLevel, GATED_BATCH_SIZE);
  }
  const single = selectNextCategory(progress, skill, categoriesByLevel);
  return single ? [single] : [];
}

export type PlacementQuestionType = "MULTIPLE_CHOICE" | "SENTENCE_ORDERING";

/** Mirrors ExerciseAnswer's shape (exercise-progress.ts) for the same two answer kinds. */
export type PlacementAnswer =
  | { type: "MULTIPLE_CHOICE"; optionId: string }
  | { type: "SENTENCE_ORDERING"; order: string[] };

export interface PlacementQuestionView {
  id: string;
  skill: PlacementSkillName;
  hskLevel: number;
  category: string;
  type: PlacementQuestionType;
  prompt: string;
  passage: string | null;
  options: { id: string; content: string }[];
  /** SENTENCE_ORDERING only - shuffled, so the order shown never leaks the answer. */
  tokens: string[];
  listening: {
    id: string;
    lines: { speaker: string; chineseText: string; lineId: string }[];
  } | null;
  /**
   * READING or LISTENING only, and only when more than one question
   * sharing this same passage/audio are still unattempted this session -
   * all of them (this question included), so the learner reads/listens
   * once and answers every question about it together, instead of the
   * same passage or audio re-appearing later once the interleaved
   * adaptive block happens to cycle back around (2026-08-16 live-testing
   * fix: "vuelve a aparecer el mismo texto" - same issue would hit
   * Listening's re-used scripts too). Null for a lone remaining question
   * (falls back to the normal single-question flow) and for every other
   * skill.
   */
  questionGroup: { id: string; prompt: string; options: { id: string; content: string }[] }[] | null;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/** No live question-authoring UI exists in this app - the item bank only changes via seed scripts/migrations, so a multi-minute staleness window costs nothing in practice (same reasoning as ttl-cache.ts's other callers). */
const PLACEMENT_QUESTION_BANK_TTL_MS = 5 * 60 * 1000;

/**
 * Every question in the bank, as the lightweight shape the adaptive engine
 * needs. Was re-fetched on *every single question served* (once per
 * getNextQuestion call, i.e. once per answer submitted) - discovered while
 * measuring the exam's real operations cost
 * (scripts/measure-placement-exam-operations.test.ts): a 147-question
 * upper-bound attempt paid for this (plus loadCategoriesBySkillAndLevel
 * below) 147 times each, ~21% of that attempt's entire operations cost,
 * for data that cannot change mid-exam. Same Tier 3 caching candidate as
 * project/db-operations-optimization.md, applied here 2026-08-19 after
 * that measurement surfaced it (this file wasn't in that audit's original
 * scope).
 */
const loadQuestionMetas = createTtlCache(async (): Promise<
  Map<string, PlacementQuestionMeta>
> => {
  const rows = await db.placementQuestion.findMany({
    select: { id: true, skill: true, hskLevel: true, category: true, type: true },
  });
  return new Map(
    rows.map((row) => [
      row.id,
      { id: row.id, skill: row.skill, hskLevel: row.hskLevel, category: row.category, type: row.type },
    ]),
  );
}, PLACEMENT_QUESTION_BANK_TTL_MS);

/** categoriesByLevel per skill, derived from whatever's actually seeded - never hardcoded, so it can never drift from the real item bank. Cached for the same reason as loadQuestionMetas above. */
const loadCategoriesBySkillAndLevel = createTtlCache(async (): Promise<
  Map<PlacementSkillName, Map<number, string[]>>
> => {
  const rows = await db.placementQuestion.findMany({
    select: { skill: true, hskLevel: true, category: true },
    distinct: ["skill", "hskLevel", "category"],
  });
  const bySkill = new Map<PlacementSkillName, Map<number, string[]>>();
  for (const row of rows) {
    const byLevel = bySkill.get(row.skill) ?? new Map<number, string[]>();
    bySkill.set(row.skill, byLevel);
    const categories = byLevel.get(row.hskLevel) ?? [];
    byLevel.set(row.hskLevel, [...categories, row.category]);
  }
  return bySkill;
}, PLACEMENT_QUESTION_BANK_TTL_MS);

export async function loadAttempts(sessionId: string): Promise<PlacementAttemptRecord[]> {
  const rows = await db.placementAttempt.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: { questionId: true, isCorrect: true },
  });
  return rows.map((row, index) => ({
    questionId: row.questionId,
    isCorrect: row.isCorrect,
    sequence: index + 1,
  }));
}

function toQuestionView(
  question: Awaited<ReturnType<typeof fetchQuestionWithRelations>>,
): PlacementQuestionView {
  if (!question) throw new PlacementExamNotFoundError("Question not found.");
  const correctOrder =
    question.type === "SENTENCE_ORDERING"
      ? ((question.correctAnswer as { order?: string[] } | null)?.order ?? [])
      : [];
  return {
    id: question.id,
    skill: question.skill,
    hskLevel: question.hskLevel,
    category: question.category,
    type: question.type,
    prompt: question.prompt,
    passage: question.passage,
    options: question.options.map((o) => ({ id: o.id, content: o.content })),
    tokens: shuffle(correctOrder),
    listening: question.listening
      ? {
          id: question.listening.id,
          lines: question.listening.lines.map((l) => ({
            lineId: l.id,
            speaker: l.speaker,
            chineseText: l.chineseText,
          })),
        }
      : null,
    questionGroup: null,
  };
}

const QUESTION_RELATIONS_INCLUDE = {
  options: { orderBy: { order: "asc" as const } },
  listening: { include: { lines: { orderBy: { order: "asc" as const } } } },
};

function fetchQuestionWithRelations(questionId: string) {
  return db.placementQuestion.findUnique({
    where: { id: questionId },
    include: QUESTION_RELATIONS_INCLUDE,
  });
}

/** Same shape as fetchQuestionWithRelations, but one query for several questions - used to build a Vocabulary/Grammar batch (buildGatedBatchView) instead of one findUnique per question. */
function fetchQuestionsWithRelations(questionIds: string[]) {
  return db.placementQuestion.findMany({
    where: { id: { in: questionIds } },
    include: QUESTION_RELATIONS_INCLUDE,
  });
}

/**
 * Builds a Vocabulary/Grammar batch view (2026-08-19 "agrupar preguntas
 * por pantalla" - project/TASKS.md, GATED_BATCH_SIZE) - one findMany for
 * every question in the batch instead of one findUnique per question, and
 * one shared submission/session-advance cycle once the learner answers all
 * of them together (submitPlacementQuestionBlock, same mechanism Reading/
 * Listening's passage/script grouping already uses). `candidateIds` is
 * already MULTIPLE_CHOICE-only and ordered (see getNextQuestion) -
 * SENTENCE_ORDERING questions never enter a batch, since block submission
 * only carries `optionId`.
 */
async function buildGatedBatchView(candidateIds: string[]): Promise<PlacementQuestionView> {
  const rows = await fetchQuestionsWithRelations(candidateIds);
  const byId = new Map(rows.map((row) => [row.id, row]));
  const ordered = candidateIds
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => row != null);
  const primary = ordered[0];
  if (!primary) throw new PlacementExamNotFoundError("Question not found.");

  const view = toQuestionView(primary);
  if (ordered.length === 1) return view;

  const group = ordered.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: q.options.map((o) => ({ id: o.id, content: o.content })),
  }));
  return { ...view, questionGroup: group };
}

/**
 * Builds a Reading question's view, grouping in every other still-
 * unattempted question sharing the same passage - see
 * PlacementQuestionView.questionGroup's doc comment for why.
 */
async function buildReadingBlockView(
  primaryId: string,
  attemptedQuestionIds: Set<string>,
): Promise<PlacementQuestionView> {
  const primary = await fetchQuestionWithRelations(primaryId);
  if (!primary) throw new PlacementExamNotFoundError("Question not found.");
  const view = toQuestionView(primary);
  if (!primary.passage) return view;

  const siblings = await db.placementQuestion.findMany({
    where: {
      skill: "READING",
      hskLevel: primary.hskLevel,
      passage: primary.passage,
      id: { not: primary.id },
    },
    include: { options: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });
  const unattemptedSiblings = siblings.filter((s) => !attemptedQuestionIds.has(s.id));
  if (unattemptedSiblings.length === 0) return view;

  const group = [primary, ...unattemptedSiblings].map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: q.options.map((o) => ({ id: o.id, content: o.content })),
  }));
  return { ...view, questionGroup: group };
}

/** Order-independent fingerprint of a listening script's dialogue - the seed data duplicates the same lines across every question about one script (mirrors Reading's duplicated `passage` string), so two questions belong to the same script iff their lines match exactly. */
function listeningFingerprint(
  lines: { speaker: string; order: number; chineseText: string }[],
): string {
  return [...lines]
    .sort((a, b) => a.order - b.order)
    .map((l) => `${l.speaker}:${l.chineseText}`)
    .join("|");
}

/**
 * Builds a Listening question's view, grouping in every other still-
 * unattempted question about the same audio script - same rationale as
 * buildReadingBlockView, since Listening's re-used scripts have the exact
 * same "re-appears later, re-listen from scratch" problem.
 */
async function buildListeningBlockView(
  primaryId: string,
  attemptedQuestionIds: Set<string>,
): Promise<PlacementQuestionView> {
  const primary = await fetchQuestionWithRelations(primaryId);
  if (!primary) throw new PlacementExamNotFoundError("Question not found.");
  const view = toQuestionView(primary);
  if (!primary.listening) return view;

  const primaryFingerprint = listeningFingerprint(primary.listening.lines);
  const candidates = await db.placementQuestion.findMany({
    where: { skill: "LISTENING", hskLevel: primary.hskLevel, id: { not: primary.id } },
    include: {
      options: { orderBy: { order: "asc" } },
      listening: { include: { lines: { orderBy: { order: "asc" } } } },
    },
    orderBy: { order: "asc" },
  });
  const siblings = candidates.filter(
    (c) =>
      c.listening &&
      !attemptedQuestionIds.has(c.id) &&
      listeningFingerprint(c.listening.lines) === primaryFingerprint,
  );
  if (siblings.length === 0) return view;

  const group = [primary, ...siblings].map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: q.options.map((o) => ({ id: o.id, content: o.content })),
  }));
  return { ...view, questionGroup: group };
}

/**
 * Resumes an existing IN_PROGRESS session instead of abandoning it - the
 * page that calls this (`app/(app)/placement-exam/page.tsx`) re-runs on
 * every load/refresh, so without this a learner who simply reloads the
 * page mid-exam would silently lose all progress and restart at question
 * one, with no warning.
 */
export async function startPlacementSession(userId: string): Promise<string> {
  const existing = await db.placementSession.findFirst({
    where: { userId, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
  });
  if (existing) return existing.id;

  const session = await db.placementSession.create({ data: { userId } });
  return session.id;
}

/**
 * Picks the next question, or null when the exam is over. Stateless by
 * design: recomputed fresh from the session's real attempts every time,
 * the same "never trust cached derived state" discipline used everywhere
 * else in this app's scoring.
 *
 * `attemptsHint`: skips the internal loadAttempts() query when the caller
 * already fetched the same session's attempts a moment ago
 * (`advanceAfterAttempt` does, to hand the same list to
 * maybeCompleteSession too) - same "don't pay for the same query twice in
 * one request" reasoning as maybeCompleteSession's `nextQuestionHint`.
 */
export async function getNextQuestion(
  sessionId: string,
  attemptsHint?: PlacementAttemptRecord[],
): Promise<PlacementQuestionView | null> {
  const session = await db.placementSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new PlacementExamNotFoundError("Session not found.");
  if (session.status === "COMPLETED") return null;

  const [questionMetas, categoriesBySkill, attempts] = await Promise.all([
    loadQuestionMetas(),
    loadCategoriesBySkillAndLevel(),
    attemptsHint ?? loadAttempts(sessionId),
  ]);
  const progress = computeCategoryProgress(attempts, questionMetas);
  const attemptedQuestionIds = new Set(attempts.map((a) => a.questionId));

  const adaptiveDone = ADAPTIVE_BLOCK_SKILLS.every((skill) =>
    isBlockSkillDone(skill, progress, categoriesBySkill),
  );

  if (!adaptiveDone) {
    // Interleave the 3 skills - offer the next question(s) from whichever
    // skill has answered the fewest questions so far this session, so no
    // single skill races ahead of the others. Vocabulary/Grammar and
    // Reading use different mechanisms under the hood (nextBlockTargets
    // dispatches correctly - see placement-exam.ts's file header) but are
    // interleaved together exactly the same way either way.
    const skillsWithTargets = ADAPTIVE_BLOCK_SKILLS.map((skill) => {
      const targets = nextBlockTargets(skill, progress, categoriesBySkill);
      const answeredCount = [...questionMetas.values()].filter(
        (q) => q.skill === skill && attemptedQuestionIds.has(q.id),
      ).length;
      return targets.length > 0 ? { skill, targets, answeredCount } : null;
    }).filter((x): x is NonNullable<typeof x> => x !== null);

    skillsWithTargets.sort((a, b) => a.answeredCount - b.answeredCount);
    // Try every skill with a target, least-answered first, not just the
    // single most-preferred one - Reading/Listening's small fixed banks
    // (unchanged mechanism) can run out of unattempted items for their
    // current category well before Vocabulary/Grammar's larger fixed gates
    // (2026-08-19 redesign) are done, and giving up entirely the moment the
    // *first-choice* skill's bank happens to be exhausted would abandon
    // Vocabulary/Grammar's still-unfinished gate prematurely - caught by
    // the integration test against real seeded content (a struggling
    // learner who answers everything wrong), not by the unit tests (which
    // used synthetic per-skill fixtures that never modeled this
    // cross-skill interaction).
    for (const entry of skillsWithTargets) {
      if (entry.skill === "READING") {
        const target = entry.targets[0]!;
        const candidate = [...questionMetas.values()].find(
          (q) =>
            q.skill === "READING" &&
            q.hskLevel === target.hskLevel &&
            q.category === target.category &&
            !attemptedQuestionIds.has(q.id),
        );
        if (candidate) return await buildReadingBlockView(candidate.id, attemptedQuestionIds);
        continue;
      }

      // Vocabulary/Grammar: fill a small batch (GATED_BATCH_SIZE) of
      // MULTIPLE_CHOICE candidates across entry.targets - cuts the fixed
      // per-question session/attempts overhead across several questions at
      // once instead of paying it per question (2026-08-19 "agrupar
      // preguntas por pantalla"). SENTENCE_ORDERING questions never enter
      // a batch - block submission (submitPlacementQuestionBlock) only
      // carries `optionId` - so if the only candidate for a target is one,
      // it falls back to being served solo, same as before this feature
      // existed.
      const batchIds: string[] = [];
      for (const target of entry.targets) {
        const candidate = [...questionMetas.values()].find(
          (q) =>
            q.skill === entry.skill &&
            q.hskLevel === target.hskLevel &&
            q.category === target.category &&
            q.type === "MULTIPLE_CHOICE" &&
            !attemptedQuestionIds.has(q.id),
        );
        if (candidate) batchIds.push(candidate.id);
      }
      if (batchIds.length > 0) return await buildGatedBatchView(batchIds);

      const soloTarget = entry.targets[0]!;
      const soloCandidate = [...questionMetas.values()].find(
        (q) =>
          q.skill === entry.skill &&
          q.hskLevel === soloTarget.hskLevel &&
          q.category === soloTarget.category &&
          !attemptedQuestionIds.has(q.id),
      );
      if (soloCandidate) {
        return toQuestionView(await fetchQuestionWithRelations(soloCandidate.id));
      }
    }
  }

  // Adaptive block finished - move to Listening. Same contiguous-from-
  // level-1 mastery rule as every other skill (selectNextCategory), not a
  // shortcut to the level the other 3 skills reached: currentSkillLevel()
  // requires level 1 to be mastered before level 2 counts, so starting
  // Listening straight at level 2 would leave level 1 permanently
  // "unmastered" (zero attempts there) and cap listeningHskLevel at 0
  // forever regardless of how level 2 went - caught by the integration
  // test against the real seeded content, not by the unit tests (which
  // used synthetic data that never hit this interaction).
  const listeningCategoriesByLevel: Map<number, string[]> =
    categoriesBySkill.get("LISTENING") ?? new Map();
  const listeningTarget = selectNextCategory(progress, "LISTENING", listeningCategoriesByLevel);
  if (listeningTarget) {
    const candidate = [...questionMetas.values()].find(
      (q) =>
        q.skill === "LISTENING" &&
        q.hskLevel === listeningTarget.hskLevel &&
        q.category === listeningTarget.category &&
        !attemptedQuestionIds.has(q.id),
    );
    if (candidate) return await buildListeningBlockView(candidate.id, attemptedQuestionIds);
  }

  return null;
}

export async function submitPlacementAnswer(
  sessionId: string,
  questionId: string,
  answer: PlacementAnswer,
): Promise<{ isCorrect: boolean }> {
  const question = await db.placementQuestion.findUnique({
    where: { id: questionId },
    include: { options: true },
  });
  if (!question) throw new PlacementExamNotFoundError("Question not found.");

  let isCorrect: boolean;
  if (answer.type === "MULTIPLE_CHOICE") {
    const selected = question.options.find((o) => o.id === answer.optionId);
    isCorrect = selected?.isCorrect ?? false;
  } else {
    const correctOrder =
      (question.correctAnswer as { order?: string[] } | null)?.order ?? [];
    isCorrect =
      correctOrder.length === answer.order.length &&
      correctOrder.every((token, index) => token === answer.order[index]);
  }

  await db.placementAttempt.create({
    data: {
      sessionId,
      questionId,
      isCorrect,
      selectedOptionId: answer.type === "MULTIPLE_CHOICE" ? answer.optionId : null,
      submittedOrder: answer.type === "SENTENCE_ORDERING" ? answer.order : undefined,
    },
  });

  return { isCorrect };
}

/**
 * Records a miss when the per-question timer runs out before the learner
 * submitted anything (HSK1-2 only, 10s limit - 2026-08-16 user request to
 * keep the exam from running long, since most test-takers clear this tier
 * fast). Deliberately a separate function rather than overloading
 * submitPlacementAnswer with an optional/empty answer - "timed out with no
 * answer" is a distinct, always-incorrect case, not just another answer
 * shape.
 */
export async function recordPlacementTimeout(
  sessionId: string,
  questionId: string,
): Promise<void> {
  await db.placementAttempt.create({
    data: { sessionId, questionId, isCorrect: false },
  });
}

/**
 * Submits every answer in a Reading or Listening block together (see
 * PlacementQuestionView.questionGroup) - one attempt row per question,
 * same grading as a single MULTIPLE_CHOICE answer. `optionId: null` means
 * the block's timer ran out before that specific question was answered -
 * recorded as a timeout miss, same as recordPlacementTimeout.
 */
export async function submitPlacementQuestionBlock(
  sessionId: string,
  answers: { questionId: string; optionId: string | null }[],
): Promise<void> {
  for (const answer of answers) {
    if (answer.optionId) {
      await submitPlacementAnswer(sessionId, answer.questionId, {
        type: "MULTIPLE_CHOICE",
        optionId: answer.optionId,
      });
    } else {
      await recordPlacementTimeout(sessionId, answer.questionId);
    }
  }
}

export interface PlacementResult {
  status: "IN_PROGRESS" | "COMPLETED";
  vocabularyHskLevel: number | null;
  grammarHskLevel: number | null;
  readingHskLevel: number | null;
  listeningHskLevel: number | null;
  totalQuestions: number;
  totalCorrect: number;
}

/**
 * Finalizes the session if it's actually over (adaptive block done + a
 * listening question is no longer available, or the early-cutoff streak
 * fired), computing each skill's detected level. Safe to call after every
 * answer - a no-op if the exam isn't actually finished yet.
 *
 * `nextQuestionHint`: `getNextQuestion()` is not cheap (several queries,
 * more once a Reading/Listening block groups in siblings), and callers
 * that already just called it themselves (`advanceAfterAttempt`) would
 * otherwise cause it to run a second time here for the exact same
 * question - once to decide "is the exam done", once again by the caller
 * to actually serve it. Pass the already-known answer through instead of
 * recomputing it; omit the argument entirely (not `null`) to have this
 * function compute it itself, same as before, for standalone callers
 * (tests, or anywhere else that only wants the result, not the next
 * question).
 *
 * `attemptsHint`: same reasoning, for `loadAttempts()` - `advanceAfterAttempt`
 * already needs this session's attempts to pass to `getNextQuestion`
 * above, so it hands the same list here too instead of a second fetch.
 */
export async function maybeCompleteSession(
  sessionId: string,
  nextQuestionHint?: PlacementQuestionView | null,
  attemptsHint?: PlacementAttemptRecord[],
): Promise<PlacementResult> {
  const session = await db.placementSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new PlacementExamNotFoundError("Session not found.");

  const attempts = attemptsHint ?? (await loadAttempts(sessionId));
  const totalCorrect = attempts.filter((a) => a.isCorrect).length;

  if (session.status === "COMPLETED") {
    return {
      status: "COMPLETED",
      vocabularyHskLevel: session.vocabularyHskLevel,
      grammarHskLevel: session.grammarHskLevel,
      readingHskLevel: session.readingHskLevel,
      listeningHskLevel: session.listeningHskLevel,
      totalQuestions: attempts.length,
      totalCorrect,
    };
  }

  const nextQuestion =
    nextQuestionHint !== undefined ? nextQuestionHint : await getNextQuestion(sessionId);
  if (nextQuestion) {
    return {
      status: "IN_PROGRESS",
      vocabularyHskLevel: null,
      grammarHskLevel: null,
      readingHskLevel: null,
      listeningHskLevel: null,
      totalQuestions: attempts.length,
      totalCorrect,
    };
  }

  const [questionMetas, categoriesBySkill] = await Promise.all([
    loadQuestionMetas(),
    loadCategoriesBySkillAndLevel(),
  ]);
  const progress = computeCategoryProgress(attempts, questionMetas);
  const levels = Object.fromEntries(
    PLACEMENT_SKILLS.map((skill) => [
      skill,
      currentLevelForSkill(skill, progress, categoriesBySkill.get(skill) ?? new Map()),
    ]),
  ) as Record<PlacementSkillName, number>;

  await db.placementSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      vocabularyHskLevel: levels.VOCABULARY,
      grammarHskLevel: levels.GRAMMAR,
      readingHskLevel: levels.READING,
      listeningHskLevel: levels.LISTENING,
    },
  });

  return {
    status: "COMPLETED",
    vocabularyHskLevel: levels.VOCABULARY,
    grammarHskLevel: levels.GRAMMAR,
    readingHskLevel: levels.READING,
    listeningHskLevel: levels.LISTENING,
    totalQuestions: attempts.length,
    totalCorrect,
  };
}
