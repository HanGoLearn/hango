import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  getNextQuestion,
  maybeCompleteSession,
  startPlacementSession,
  submitPlacementAnswer,
  submitPlacementQuestionBlock,
  type PlacementQuestionView,
} from "@/lib/placement-exam-data";

// Exercises the real, seeded HSK1-9 item bank (scripts/seed-placement-exam-full.mjs)
// end to end against the real database - this is the adaptive engine's only
// verification against actual content, not synthetic fixtures, since the
// unit tests in tests/unit/placement-exam.test.ts already cover the pure
// logic in isolation.

const testUserIds: string[] = [];
const testSessionIds: string[] = [];

afterEach(async () => {
  if (testSessionIds.length > 0) {
    await db.placementAttempt.deleteMany({
      where: { sessionId: { in: testSessionIds } },
    });
    await db.placementSession.deleteMany({
      where: { id: { in: testSessionIds } },
    });
    testSessionIds.length = 0;
  }
  if (testUserIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: testUserIds } } });
    testUserIds.length = 0;
  }
});

async function createTestUser(email: string) {
  const user = await db.user.create({ data: { email } });
  testUserIds.push(user.id);
  return user;
}

/**
 * Submits the correct answer for either question shape - MULTIPLE_CHOICE
 * (look up the option flagged isCorrect) or SENTENCE_ORDERING (replay
 * correctAnswer.order verbatim). The view layer never exposes either the
 * correct option or the answer key (matches the app's own "never trust a
 * client-supplied answer" convention) - look them up directly from the DB
 * for this test-only always-correct/always-wrong path.
 */
async function submitCorrect(
  userId: string,
  sessionId: string,
  question: PlacementQuestionView,
) {
  if (question.questionGroup && question.questionGroup.length > 1) {
    const answers = await Promise.all(
      question.questionGroup.map(async (groupQuestion) => ({
        questionId: groupQuestion.id,
        optionId: await correctOptionIdFor(groupQuestion.id),
      })),
    );
    return submitPlacementQuestionBlock(userId, sessionId, answers);
  }
  if (question.type === "SENTENCE_ORDERING") {
    const full = await db.placementQuestion.findUniqueOrThrow({
      where: { id: question.id },
    });
    const order = (full.correctAnswer as { order: string[] }).order;
    return submitPlacementAnswer(userId, sessionId, question.id, {
      type: "SENTENCE_ORDERING",
      order,
    });
  }
  const full = await db.placementQuestion.findUniqueOrThrow({
    where: { id: question.id },
    include: { options: true },
  });
  const correct = full.options.find((o) => o.isCorrect)!;
  return submitPlacementAnswer(userId, sessionId, question.id, {
    type: "MULTIPLE_CHOICE",
    optionId: correct.id,
  });
}

async function submitWrong(
  userId: string,
  sessionId: string,
  question: PlacementQuestionView,
) {
  if (question.questionGroup && question.questionGroup.length > 1) {
    const answers = await Promise.all(
      question.questionGroup.map(async (groupQuestion) => ({
        questionId: groupQuestion.id,
        optionId: await wrongOptionIdFor(groupQuestion.id),
      })),
    );
    return submitPlacementQuestionBlock(userId, sessionId, answers);
  }
  if (question.type === "SENTENCE_ORDERING") {
    const full = await db.placementQuestion.findUniqueOrThrow({
      where: { id: question.id },
    });
    const order = (full.correctAnswer as { order: string[] }).order;
    return submitPlacementAnswer(userId, sessionId, question.id, {
      type: "SENTENCE_ORDERING",
      order: [...order].reverse(),
    });
  }
  const full = await db.placementQuestion.findUniqueOrThrow({
    where: { id: question.id },
    include: { options: true },
  });
  const wrong = full.options.find((o) => !o.isCorrect)!;
  return submitPlacementAnswer(userId, sessionId, question.id, {
    type: "MULTIPLE_CHOICE",
    optionId: wrong.id,
  });
}

async function correctOptionIdFor(questionId: string): Promise<string> {
  const full = await db.placementQuestion.findUniqueOrThrow({
    where: { id: questionId },
    include: { options: true },
  });
  const correct = full.options.find((o) => o.isCorrect);
  if (!correct) throw new Error(`no correct option for ${questionId}`);
  return correct.id;
}

async function wrongOptionIdFor(questionId: string): Promise<string> {
  const full = await db.placementQuestion.findUniqueOrThrow({
    where: { id: questionId },
    include: { options: true },
  });
  const wrong = full.options.find((o) => !o.isCorrect);
  if (!wrong) throw new Error(`no wrong option for ${questionId}`);
  return wrong.id;
}

async function answerCorrectly(userId: string, sessionId: string) {
  let question = await getNextQuestion(userId, sessionId);
  let guard = 0;
  while (question && guard < 400) {
    guard++;
    await submitCorrect(userId, sessionId, question);
    question = await getNextQuestion(userId, sessionId);
  }
  return guard;
}

async function answerIncorrectly(
  userId: string,
  sessionId: string,
  maxAttempts: number,
) {
  let question = await getNextQuestion(userId, sessionId);
  let count = 0;
  while (question && count < maxAttempts) {
    count++;
    await submitWrong(userId, sessionId, question);
    question = await getNextQuestion(userId, sessionId);
  }
  return count;
}

describe("Placement exam adaptive flow (integration, real database, real seeded content)", () => {
  it("reaches the HSK7-9 ceiling in every skill when every answer is correct", async () => {
    const user = await createTestUser(
      `placement-correct-${Date.now()}@hango.dev`,
    );
    const sessionId = await startPlacementSession(user.id);
    testSessionIds.push(sessionId);

    const questionsAnswered = await answerCorrectly(user.id, sessionId);
    expect(questionsAnswered).toBeGreaterThan(0);

    const result = await maybeCompleteSession(user.id, sessionId);
    expect(result.status).toBe("SPEAKING");
    // hskLevel 7 in the DB represents the combined HSK7-9 tier (the official
    // syllabus's own merged grammar table/vocabulary pool for that range) -
    // diagnostic only, per points_system.md's Lab-evidence-only rule.
    expect(result.vocabularyHskLevel).toBe(7);
    expect(result.grammarHskLevel).toBe(7);
    expect(result.readingHskLevel).toBe(7);
    expect(result.listeningHskLevel).toBe(7);

    const persistedSession = await db.placementSession.findUniqueOrThrow({
      where: { id: sessionId },
    });
    expect(persistedSession.status).toBe("SPEAKING");
    expect(persistedSession.completedAt).toBeNull();
  }, 300000);

  it("batches Vocabulary questions 2 at a time and accepts them in one block submission (2026-08-19 'agrupar preguntas por pantalla' - real seeded HSK1 Vocabulary is 100% MULTIPLE_CHOICE, per scripts/seed-placement-exam-full.mjs, so the very first question of a fresh session is always a full 2-question batch)", async () => {
    const user = await createTestUser(
      `placement-batch-${Date.now()}@hango.dev`,
    );
    const sessionId = await startPlacementSession(user.id);
    testSessionIds.push(sessionId);

    const question = await getNextQuestion(user.id, sessionId);
    if (!question) throw new Error("expected a first question");
    expect(question.skill).toBe("VOCABULARY");
    expect(question.questionGroup).not.toBeNull();
    expect(question.questionGroup).toHaveLength(2);

    const answers = await Promise.all(
      question.questionGroup!.map(async (groupQuestion) => ({
        questionId: groupQuestion.id,
        optionId: await correctOptionIdFor(groupQuestion.id),
      })),
    );
    await submitPlacementQuestionBlock(user.id, sessionId, answers);

    const attempts = await db.placementAttempt.findMany({
      where: { sessionId },
    });
    expect(attempts).toHaveLength(2);
    expect(attempts.every((a) => a.isCorrect)).toBe(true);
    expect(new Set(attempts.map((a) => a.questionId))).toEqual(
      new Set(answers.map((a) => a.questionId)),
    );
  }, 30000);

  it("each skill permanently stops the moment its HSK1 gate is mathematically decided, when every answer is wrong (2026-08-19 redesign + early-exit, extended to Reading/Listening 2026-08-27 - replaces the old global 3-wrong-in-a-row cutoff)", async () => {
    const user = await createTestUser(
      `placement-wrong-${Date.now()}@hango.dev`,
    );
    const sessionId = await startPlacementSession(user.id);
    testSessionIds.push(sessionId);

    // Generous guard - the real counts below are much smaller.
    await answerIncorrectly(user.id, sessionId, 60);

    const result = await maybeCompleteSession(user.id, sessionId);
    expect(result.status).toBe("COMPLETED");
    // Nobody masters anything when every answer is wrong.
    expect(result.vocabularyHskLevel).toBe(0);
    expect(result.grammarHskLevel).toBe(0);
    expect(result.readingHskLevel).toBe(0);
    expect(result.listeningHskLevel).toBe(0);

    // The real proof this isn't just "ran out of guard": with every answer
    // wrong, levelGateStatus's early exit (placement-exam.ts) resolves
    // "failed" as soon as a perfect remaining score still couldn't reach
    // the 80% threshold - Vocabulary HSK1-4 (4 categories x2 = 8
    // questions, needs 7) is decided after exactly 2 wrong answers
    // (0 correct + 6 remaining = 6 < 7); Grammar HSK1-4 (6 categories x2 =
    // 12 questions, needs 10) is mathematically decided after 3 misses,
    // but the UI submits this skill in 2-question batches, so the server
    // re-evaluates the gate at the next real screen boundary: 4 attempts.
    // Reading and Listening HSK1 (single "comprehension" category, 4 real
    // questions, threshold ceil(4*0.8)=4) are mathematically decided after
    // 1 wrong answer, but their real UI groups the two questions that share
    // one passage/audio, so the gate is re-evaluated after that 2-question
    // screen. No skill gets another screen once the outcome can no longer
    // change.
    const attempts = await db.placementAttempt.findMany({
      where: { sessionId },
      include: { question: { select: { skill: true } } },
    });
    const countBySkill = (skill: string) =>
      attempts.filter((a) => a.question.skill === skill).length;
    expect(countBySkill("VOCABULARY")).toBe(2);
    expect(countBySkill("GRAMMAR")).toBe(4);
    expect(countBySkill("READING")).toBe(2);
    expect(countBySkill("LISTENING")).toBe(2);
  }, 60000);

  it("never asks the same question twice in one session", async () => {
    const user = await createTestUser(
      `placement-dedupe-${Date.now()}@hango.dev`,
    );
    const sessionId = await startPlacementSession(user.id);
    testSessionIds.push(sessionId);

    const seen = new Set<string>();
    let question = await getNextQuestion(user.id, sessionId);
    let guard = 0;
    while (question && guard < 400) {
      guard++;
      expect(seen.has(question.id)).toBe(false);
      seen.add(question.id);
      await submitCorrect(user.id, sessionId, question);
      question = await getNextQuestion(user.id, sessionId);
    }
  }, 300000);

  it("interleaves Vocabulary, Grammar, and Reading instead of finishing one before starting the next", async () => {
    const user = await createTestUser(
      `placement-interleave-${Date.now()}@hango.dev`,
    );
    const sessionId = await startPlacementSession(user.id);
    testSessionIds.push(sessionId);

    const skillSequence: string[] = [];
    let question = await getNextQuestion(user.id, sessionId);
    for (let i = 0; i < 6 && question; i++) {
      skillSequence.push(question.skill);
      await submitCorrect(user.id, sessionId, question);
      question = await getNextQuestion(user.id, sessionId);
    }
    const distinctSkillsInFirst6 = new Set(skillSequence);
    expect(distinctSkillsInFirst6.size).toBeGreaterThan(1);
  }, 30000);

  it("resumes an in-progress session instead of starting a new one", async () => {
    const user = await createTestUser(
      `placement-resume-${Date.now()}@hango.dev`,
    );
    const firstSessionId = await startPlacementSession(user.id);
    testSessionIds.push(firstSessionId);

    // Simulates a page reload mid-exam (page.tsx calls startPlacementSession
    // on every load) - must resume, not silently discard progress.
    const secondSessionId = await startPlacementSession(user.id);
    expect(secondSessionId).toBe(firstSessionId);

    await db.placementSession.update({
      where: { id: firstSessionId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    const thirdSessionId = await startPlacementSession(user.id);
    testSessionIds.push(thirdSessionId);
    expect(thirdSessionId).not.toBe(firstSessionId);
  }, 15000);
});
