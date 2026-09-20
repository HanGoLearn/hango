/**
 * Measures the REAL database-operations cost of one full WRITTEN
 * placement exam attempt (Vocabulary -> Grammar -> Reading -> Listening,
 * the adaptive block described in src/lib/placement-exam-data.ts), end to
 * end, calling the exact same SERVER ACTIONS the real browser calls
 * (src/lib/actions/placement-exam.ts) - not the lower-level data-layer
 * functions directly, and not raw Prisma queries picked to look
 * favorable.
 *
 * WHY THE ACTION LAYER SPECIFICALLY (2026-08-19, second version of this
 * script): a first version called getNextQuestion/submitPlacementAnswer
 * directly, which measured a DIFFERENT and less accurate number than real
 * usage - it never passed the `attempts`/`nextQuestion` hints
 * `advanceAfterAttempt` (actions/placement-exam.ts) passes internally
 * (overcounts by paying for loadAttempts() on every getNextQuestion call),
 * and it only called maybeCompleteSession() once at the very end instead
 * of after every answer the way advanceAfterAttempt does (undercounts,
 * since that function's own placementSession.findUnique runs
 * unconditionally on every call, hints or not). Those two errors don't
 * cancel out exactly. Calling the real actions (with `auth()` mocked to
 * this throwaway user, same pattern every integration test in this repo
 * already uses) sidesteps the whole question by construction.
 *
 * WHY THIS EXISTS: user asked, after the Tier 1-4 dashboard/lesson-session
 * optimization pass, how many operations the placement exam itself costs -
 * to weigh reducing/cutting its 211-question item bank against the
 * quota. Same "get a REAL measured number instead of a guess" motivation
 * as scripts/measure-lesson-operations.test.ts.
 *
 * SCOPE: WRITTEN skills only (Vocabulary/Grammar/Reading/Listening).
 * Speaking is deliberately NOT included here - it requires a real live
 * voice conversation (HanVoiceConversation, OpenAI Realtime API) that
 * cannot be scripted, and its cost is dominated by realtime-voice-API
 * minutes, not Prisma "Operations" - a different budget entirely, not
 * something this script can meaningfully measure. See this session's
 * chat/report for that discussion.
 *
 * ANSWER STRATEGY: always answers correctly. This is deliberate, not
 * incidental - answering everything right makes the adaptive engine climb
 * as high as it goes in every skill before stopping, which is close to
 * the *most* questions (and therefore the highest operations cost) a real
 * attempt can produce. A learner who answers inconsistently or fails
 * early would see FEWER questions and a LOWER cost than this run
 * measures - so treat this as close to an upper bound, not an average.
 *
 * MEASUREMENT-SCRIPT OVERHEAD (subtract this to read the real number):
 * exactly ONE extra operation - a single `findMany` over the whole
 * question bank, fetched once before the exam loop starts, purely so this
 * script can look up each question's correct answer locally instead of
 * guessing (a real user's own answer choice costs nothing extra - this is
 * this script's own bookkeeping only). No other query in this file exists
 * only for the script's own purposes.
 *
 * LISTENING AUDIO COST WARNING: real Listening questions trigger
 * `getPlacementListeningAudioAction` (same action the real audio-play
 * button calls) - generate-once-and-cache-forever
 * (placement-listening-audio.ts), so this is a real, small, PAID TTS call
 * only for any Listening script that has never been generated before in
 * this database; already-generated scripts (this exam was seeded and
 * live-tested earlier today, per project/TASKS.md) are a free cached
 * read. Cannot know in advance which case applies without checking -
 * don't run this repeatedly without reason.
 *
 * CLEANUP: creates one throwaway test user, then deletes it in a `finally`
 * block. `PlacementSession`/`PlacementAttempt` cascade from User via
 * `onDelete: Cascade` (schema.prisma) - confirm before relying on this if
 * that ever changes.
 *
 * HOW TO MEASURE: same 3-step recipe as measure-lesson-operations.test.ts
 * - check the Prisma Console's Operations count before, run
 * `npx vitest run --config vitest.measure.config.mts scripts/measure-placement-exam-operations.test.ts`
 * (needs the same scripts/-including override vitest.config.mts's default
 * `include` doesn't cover), check it again after. The delta minus 1 (this
 * script's own answer-lookup query) is the real cost of one full written
 * attempt.
 *
 * WHY THIS RUNS VIA VITEST, NOT PLAIN NODE/TSX: same `import "server-only"`
 * / react-server-condition reasons as measure-lesson-operations.test.ts.
 *
 * WHY auth() IS MOCKED: every action below is a real Server Action
 * (`"use server"`) that calls `auth()` first - outside of a real HTTP
 * request there is no session to read, so every call would short-circuit
 * with `{ok:false}` without this, same as every other integration test in
 * this repo that exercises action-layer functions directly.
 */
import { describe, expect, it, vi } from "vitest";
import { writeFileSync } from "node:fs";
import { db } from "@/lib/db";
import type { PlacementSkillName } from "@/lib/placement-exam";
import type { PlacementQuestionView } from "@/lib/placement-exam-data";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const {
  startPlacementExamAction,
  submitPlacementAnswerAction,
  submitPlacementQuestionBlockAction,
  getPlacementListeningAudioAction,
} = await import("@/lib/actions/placement-exam");

describe("manual measurement tool - not part of the regular CI suite", () => {
  it("runs one full written placement exam (always-correct, via the real server actions) and leaves the database clean afterward", async () => {
    const email = `placement-ops-measurement-${Date.now()}@hango.dev`;
    const user = await db.user.create({ data: { email } });
    authMock.mockResolvedValue({ user: { id: user.id } });
    console.log("Created throwaway measurement user:", user.id, email);

    try {
      // The ONE piece of measurement-script overhead (see file header) -
      // every other call below is exactly what the real exam UI/actions do.
      const bank = await db.placementQuestion.findMany({
        include: { options: true },
      });
      const bankById = new Map(bank.map((q) => [q.id, q]));

      function correctMultipleChoiceOptionId(questionId: string): string {
        const bankQuestion = bankById.get(questionId);
        const correct = bankQuestion?.options.find((o) => o.isCorrect);
        if (!correct) {
          throw new Error(`No correct option found for question ${questionId}`);
        }
        return correct.id;
      }

      function correctOrder(questionId: string): string[] {
        const bankQuestion = bankById.get(questionId);
        const raw = bankQuestion?.correctAnswer as { order?: string[] } | null;
        return raw?.order ?? [];
      }

      const started = await startPlacementExamAction();
      if (!started.ok) throw new Error(`startPlacementExamAction failed: ${started.error}`);
      const sessionId = started.value.sessionId;

      let questionCount = 0;
      let blockCount = 0;
      const bySkill: Record<PlacementSkillName, number> = {
        VOCABULARY: 0,
        GRAMMAR: 0,
        READING: 0,
        LISTENING: 0,
      };

      let question: PlacementQuestionView | null = started.value.question;
      while (question) {
        bySkill[question.skill] += 1;

        if (question.listening) {
          const audio = await getPlacementListeningAudioAction(sessionId, question.id);
          if (!audio.ok) throw new Error(`getPlacementListeningAudioAction failed: ${audio.error}`);
        }

        const isBlock = Boolean(question.questionGroup && question.questionGroup.length > 1);
        let advanceResult;
        if (isBlock) {
          blockCount += 1;
          const groupIds = question.questionGroup!.map((q) => q.id);
          questionCount += groupIds.length;
          const answers = groupIds.map((questionId) => ({
            questionId,
            optionId: correctMultipleChoiceOptionId(questionId),
          }));
          advanceResult = await submitPlacementQuestionBlockAction(sessionId, answers);
        } else {
          questionCount += 1;
          const answer =
            question.type === "SENTENCE_ORDERING"
              ? ({ type: "SENTENCE_ORDERING", order: correctOrder(question.id) } as const)
              : ({ type: "MULTIPLE_CHOICE", optionId: correctMultipleChoiceOptionId(question.id) } as const);
          advanceResult = await submitPlacementAnswerAction(sessionId, question.id, answer);
        }

        if (!advanceResult.ok) {
          throw new Error(`advance action failed: ${advanceResult.error}`);
        }
        question = advanceResult.value.nextQuestion;
      }

      writeFileSync(
        "scratch-placement-exam-measurement.json",
        JSON.stringify({ questionCount, blockCount, bySkill }, null, 2),
      );
      console.log(
        "Placement exam simulation complete - check the Prisma Console Operations delta now.",
      );
      expect(questionCount).toBeGreaterThan(0);
    } finally {
      await db.user.delete({ where: { id: user.id } });
      console.log("Cleaned up throwaway measurement user.");
    }
  }, 300_000);
});
