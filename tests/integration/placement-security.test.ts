import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  getNextQuestion,
  maybeCompleteSession,
  PlacementExamInvalidSubmissionError,
  PlacementExamNotFoundError,
  startPlacementSession,
  submitPlacementAnswer,
  submitPlacementQuestionBlock,
  type PlacementQuestionView,
} from "@/lib/placement-exam-data";

const testUserIds: string[] = [];

afterEach(async () => {
  if (testUserIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: testUserIds } } });
    testUserIds.length = 0;
  }
});

async function createTestUser(label: string) {
  const user = await db.user.create({
    data: {
      email: `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@hango.dev`,
    },
  });
  testUserIds.push(user.id);
  return user;
}

async function currentBlock(userId: string, sessionId: string) {
  const question = await getNextQuestion(userId, sessionId);
  if (!question?.questionGroup || question.questionGroup.length < 2) {
    throw new Error(
      "Expected the seeded first placement screen to be a block.",
    );
  }
  return question;
}

async function correctBlockAnswers(question: PlacementQuestionView) {
  return Promise.all(
    question.questionGroup!.map(async (item) => {
      const row = await db.placementQuestion.findUniqueOrThrow({
        where: { id: item.id },
        include: { options: true },
      });
      const correct = row.options.find((option) => option.isCorrect);
      if (!correct) throw new Error(`No correct option for ${item.id}`);
      return { questionId: item.id, optionId: correct.id };
    }),
  );
}

describe("Placement exam authorization and integrity", () => {
  it("never exposes or mutates another learner's placement session", async () => {
    const owner = await createTestUser("placement-owner");
    const attacker = await createTestUser("placement-attacker");
    const sessionId = await startPlacementSession(owner.id);
    const question = await currentBlock(owner.id, sessionId);
    const answers = await correctBlockAnswers(question);

    await expect(
      getNextQuestion(attacker.id, sessionId),
    ).rejects.toBeInstanceOf(PlacementExamNotFoundError);
    await expect(
      submitPlacementQuestionBlock(attacker.id, sessionId, answers),
    ).rejects.toBeInstanceOf(PlacementExamNotFoundError);
    await expect(
      maybeCompleteSession(attacker.id, sessionId),
    ).rejects.toBeInstanceOf(PlacementExamNotFoundError);

    expect(await db.placementAttempt.count({ where: { sessionId } })).toBe(0);
  });

  it("requires the exact current block and rejects options from other questions", async () => {
    const user = await createTestUser("placement-exact-block");
    const sessionId = await startPlacementSession(user.id);
    const question = await currentBlock(user.id, sessionId);
    const answers = await correctBlockAnswers(question);

    await expect(
      submitPlacementQuestionBlock(user.id, sessionId, answers.slice(0, 1)),
    ).rejects.toBeInstanceOf(PlacementExamInvalidSubmissionError);
    await expect(
      submitPlacementQuestionBlock(user.id, sessionId, [
        answers[0]!,
        answers[0]!,
      ]),
    ).rejects.toBeInstanceOf(PlacementExamInvalidSubmissionError);

    const swappedOptions = answers.map((answer, index) => ({
      ...answer,
      optionId: answers[(index + 1) % answers.length]!.optionId,
    }));
    await expect(
      submitPlacementQuestionBlock(user.id, sessionId, swappedOptions),
    ).rejects.toBeInstanceOf(PlacementExamInvalidSubmissionError);

    expect(await db.placementAttempt.count({ where: { sessionId } })).toBe(0);
  });

  it("accepts only one of two concurrent replays of the same block", async () => {
    const user = await createTestUser("placement-concurrent-replay");
    const sessionId = await startPlacementSession(user.id);
    const question = await currentBlock(user.id, sessionId);
    const answers = await correctBlockAnswers(question);

    const results = await Promise.allSettled([
      submitPlacementQuestionBlock(user.id, sessionId, answers),
      submitPlacementQuestionBlock(user.id, sessionId, answers),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    expect(await db.placementAttempt.count({ where: { sessionId } })).toBe(
      answers.length,
    );
  });

  it("rejects a single-question submission while the current screen is a block", async () => {
    const user = await createTestUser("placement-single-bypass");
    const sessionId = await startPlacementSession(user.id);
    const question = await currentBlock(user.id, sessionId);
    const first = question.questionGroup![0]!;
    const optionId = (await correctBlockAnswers(question))[0]!.optionId;

    await expect(
      submitPlacementAnswer(user.id, sessionId, first.id, {
        type: "MULTIPLE_CHOICE",
        optionId,
      }),
    ).rejects.toBeInstanceOf(PlacementExamInvalidSubmissionError);
    expect(await db.placementAttempt.count({ where: { sessionId } })).toBe(0);
  });
});
