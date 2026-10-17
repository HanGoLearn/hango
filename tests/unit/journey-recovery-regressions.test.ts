import { describe, expect, it } from "vitest";
import {
  passedJourneyQuickTestEvidence,
  summarizeJourneyQuiz,
} from "@/lib/journey-lesson-report";
import { canRecoverJourneyEvaluation } from "@/lib/journey-evaluation-recovery";

const ids = Array.from({ length: 10 }, (_, i) => `word-${i}`);
const answers = (correct: number) =>
  ids.map((id, i) => ({
    id: `answer-${i}`,
    key: `${id}:quicktest`,
    isCorrect: i < correct,
  }));
describe("real quick-test regression: 9 correct, one wrong, no unseen remediation", () => {
  it.each([8, 9, 10])(
    "uses all ten real answers at the passing threshold (%s/10)",
    (correct) => {
      const evidence = passedJourneyQuickTestEvidence(ids, answers(correct))!;
      expect(summarizeJourneyQuiz(evidence)).toMatchObject({
        state: "COMPLETE",
        total: 10,
        correct,
        incorrect: 10 - correct,
        missing: 0,
        score: correct * 10,
      });
    },
  );
  it("does not bypass remediation after a failed or incomplete quick test", () => {
    expect(passedJourneyQuickTestEvidence(ids, answers(7))).toBeNull();
    expect(
      passedJourneyQuickTestEvidence(ids, answers(9).slice(0, 9)),
    ).toBeNull();
    expect(
      passedJourneyQuickTestEvidence(
        ids,
        answers(9).map((row, i) =>
          i === 9 ? { ...row, isCorrect: null } : row,
        ),
      ),
    ).toBeNull();
    expect(passedJourneyQuickTestEvidence([], [])).toBeNull();
  });
  it("later correct retries and unrelated answers cannot replace first answers", () => {
    expect(
      passedJourneyQuickTestEvidence(ids, [...answers(7), ...answers(10)]),
    ).toBeNull();
    expect(
      passedJourneyQuickTestEvidence(ids, [
        { id: "extra", key: "unknown:quicktest", isCorrect: true },
        ...answers(9),
      ]),
    ).toHaveLength(10);
  });
});
describe("explicit recovery policy", () => {
  it("allows one recovery of a rejected judgment but never a third dispatch", () => {
    expect(
      canRecoverJourneyEvaluation({
        status: "FAILED",
        requestCount: 1,
        failureCode: "invalid_evidence",
      }),
    ).toBe(true);
    expect(
      canRecoverJourneyEvaluation({
        status: "FAILED",
        requestCount: 2,
        failureCode: "invalid_evidence",
      }),
    ).toBe(false);
  });
  it.each(["PENDING", "PROCESSING", "COMPLETE", "PARTIAL", "INSUFFICIENT"])(
    "never recovers %s",
    (status) => {
      expect(
        canRecoverJourneyEvaluation({
          status,
          requestCount: 1,
          failureCode: "invalid_evidence",
        }),
      ).toBe(false);
    },
  );
  it.each([
    "provider_refused",
    "structured_provider_unavailable",
    "evaluation_failed",
    null,
  ])(
    "does not bypass refusal/configuration/unknown failures (%s)",
    (failureCode) => {
      expect(
        canRecoverJourneyEvaluation({
          status: "FAILED",
          requestCount: 1,
          failureCode,
        }),
      ).toBe(false);
    },
  );
});
