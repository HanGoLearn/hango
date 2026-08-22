import { describe, expect, it } from "vitest";
import {
  computeCategoryProgress,
  currentGatedLevel,
  currentSkillLevel,
  hasGatedSkillStopped,
  isLevelMastered,
  levelGateStatus,
  levelPassThreshold,
  nextGatedQuestionTarget,
  nextGatedQuestionTargets,
  questionsPerCategory,
  selectNextCategory,
  type PlacementAttemptRecord,
  type PlacementQuestionMeta,
} from "@/lib/placement-exam";

const CATEGORIES_BY_LEVEL = new Map<number, string[]>([
  [1, ["noun", "verb"]],
  [2, ["noun", "verb"]],
]);

function question(
  id: string,
  hskLevel: number,
  category: string,
  skill: PlacementQuestionMeta["skill"] = "VOCABULARY",
  type: PlacementQuestionMeta["type"] = "MULTIPLE_CHOICE",
): PlacementQuestionMeta {
  return { id, skill, hskLevel, category, type };
}

function attempt(questionId: string, isCorrect: boolean, sequence: number): PlacementAttemptRecord {
  return { questionId, isCorrect, sequence };
}

// ============================================================================
// computeCategoryProgress - shared by both mechanisms
// ============================================================================

describe("computeCategoryProgress", () => {
  const questions = new Map(
    [question("q1", 1, "noun"), question("q2", 1, "noun"), question("q3", 1, "verb")].map(
      (q) => [q.id, q],
    ),
  );

  it("tracks attempted and correct counts separately, not just correct", () => {
    const attempts = [attempt("q1", true, 1), attempt("q2", false, 2), attempt("q3", true, 3)];
    const progress = computeCategoryProgress(attempts, questions);
    expect(progress.get("VOCABULARY")?.get(1)?.get("noun")).toEqual({ attempted: 2, correct: 1 });
    expect(progress.get("VOCABULARY")?.get(1)?.get("verb")).toEqual({ attempted: 1, correct: 1 });
  });

  it("ignores attempts for questions not in the bank", () => {
    const progress = computeCategoryProgress([attempt("ghost", true, 1)], questions);
    expect(progress.size).toBe(0);
  });
});

// ============================================================================
// Accumulate-to-mastery mechanism - Reading/Listening (unchanged design)
// ============================================================================

describe("accumulate-to-mastery mechanism (Reading/Listening)", () => {
  describe("isLevelMastered", () => {
    const questions = new Map(
      [
        question("q1", 1, "noun"), question("q2", 1, "noun"),
        question("q3", 1, "verb"), question("q4", 1, "verb"),
      ].map((q) => [q.id, q]),
    );

    it("does not master a level until every category clears the threshold", () => {
      const attempts = [attempt("q1", true, 1), attempt("q2", true, 2)]; // noun x2, verb x0
      const progress = computeCategoryProgress(attempts, questions);
      expect(isLevelMastered(progress, "VOCABULARY", 1, ["noun", "verb"])).toBe(false);
    });

    it("masters a level once every category clears the threshold", () => {
      const attempts = [
        attempt("q1", true, 1), attempt("q2", true, 2),
        attempt("q3", true, 3), attempt("q4", true, 4),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(isLevelMastered(progress, "VOCABULARY", 1, ["noun", "verb"])).toBe(true);
    });

    it("ignores incorrect attempts", () => {
      const attempts = [attempt("q1", false, 1), attempt("q2", false, 2)];
      const progress = computeCategoryProgress(attempts, questions);
      expect(isLevelMastered(progress, "VOCABULARY", 1, ["noun", "verb"])).toBe(false);
    });

    it("a category with no item bank entries can never be mastered - not silently ignored", () => {
      const progress = computeCategoryProgress([], questions);
      expect(isLevelMastered(progress, "VOCABULARY", 1, ["noun", "verb", "adjective"])).toBe(false);
    });
  });

  describe("currentSkillLevel", () => {
    const questions = new Map(
      [
        question("l1n1", 1, "noun"), question("l1n2", 1, "noun"),
        question("l1v1", 1, "verb"), question("l1v2", 1, "verb"),
        question("l2n1", 2, "noun"), question("l2n2", 2, "noun"),
        question("l2v1", 2, "verb"), question("l2v2", 2, "verb"),
      ].map((q) => [q.id, q]),
    );

    it("returns 0 (Pre-HSK) when nothing is mastered", () => {
      const progress = computeCategoryProgress([], questions);
      expect(currentSkillLevel(progress, "VOCABULARY", CATEGORIES_BY_LEVEL)).toBe(0);
    });

    it("cannot skip to level 2 without mastering level 1 first - a gap blocks credit", () => {
      const attempts = [
        attempt("l2n1", true, 1), attempt("l2n2", true, 2),
        attempt("l2v1", true, 3), attempt("l2v2", true, 4),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(currentSkillLevel(progress, "VOCABULARY", CATEGORIES_BY_LEVEL)).toBe(0);
    });

    it("credits level 1 once mastered, even if level 2 isn't", () => {
      const attempts = [
        attempt("l1n1", true, 1), attempt("l1n2", true, 2),
        attempt("l1v1", true, 3), attempt("l1v2", true, 4),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(currentSkillLevel(progress, "VOCABULARY", CATEGORIES_BY_LEVEL)).toBe(1);
    });

    it("credits level 2 once both levels are mastered", () => {
      const attempts = [
        attempt("l1n1", true, 1), attempt("l1n2", true, 2),
        attempt("l1v1", true, 3), attempt("l1v2", true, 4),
        attempt("l2n1", true, 5), attempt("l2n2", true, 6),
        attempt("l2v1", true, 7), attempt("l2v2", true, 8),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(currentSkillLevel(progress, "VOCABULARY", CATEGORIES_BY_LEVEL)).toBe(2);
    });
  });

  describe("selectNextCategory", () => {
    it("targets the category furthest from the threshold first", () => {
      const questions = new Map(
        [question("q1", 1, "noun"), question("q2", 1, "verb")].map((q) => [q.id, q]),
      );
      const attempts = [attempt("q1", true, 1)]; // noun=1, verb=0
      const progress = computeCategoryProgress(attempts, questions);
      const next = selectNextCategory(progress, "VOCABULARY", CATEGORIES_BY_LEVEL);
      expect(next).toEqual({ hskLevel: 1, category: "verb" });
    });

    it("returns null once the pilot ceiling is fully mastered", () => {
      const questions = new Map(
        [
          question("l1n1", 1, "noun"), question("l1n2", 1, "noun"),
          question("l1v1", 1, "verb"), question("l1v2", 1, "verb"),
          question("l2n1", 2, "noun"), question("l2n2", 2, "noun"),
          question("l2v1", 2, "verb"), question("l2v2", 2, "verb"),
        ].map((q) => [q.id, q]),
      );
      const attempts = [
        attempt("l1n1", true, 1), attempt("l1n2", true, 2),
        attempt("l1v1", true, 3), attempt("l1v2", true, 4),
        attempt("l2n1", true, 5), attempt("l2n2", true, 6),
        attempt("l2v1", true, 7), attempt("l2v2", true, 8),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(selectNextCategory(progress, "VOCABULARY", CATEGORIES_BY_LEVEL)).toBeNull();
    });
  });
});

// ============================================================================
// Level-gate mechanism - Vocabulary/Grammar (2026-08-19 redesign)
// ============================================================================

describe("level-gate mechanism (Vocabulary/Grammar)", () => {
  describe("questionsPerCategory", () => {
    it("is 2 for Vocabulary HSK1-4", () => {
      expect(questionsPerCategory("VOCABULARY", 1)).toBe(2);
      expect(questionsPerCategory("VOCABULARY", 4)).toBe(2);
    });

    it("is 3 for Vocabulary HSK5-9 specifically - the no-margin fix", () => {
      expect(questionsPerCategory("VOCABULARY", 5)).toBe(3);
      expect(questionsPerCategory("VOCABULARY", 9)).toBe(3);
    });

    it("is 2 for Grammar at every level - it never had the 2-category margin problem", () => {
      expect(questionsPerCategory("GRAMMAR", 1)).toBe(2);
      expect(questionsPerCategory("GRAMMAR", 5)).toBe(2);
      expect(questionsPerCategory("GRAMMAR", 9)).toBe(2);
    });
  });

  describe("levelPassThreshold", () => {
    it("rounds up, never down - 80% of 8 is 6.4, needs 7", () => {
      expect(levelPassThreshold(8)).toBe(7);
    });

    it("80% of 12 is 9.6, needs 10", () => {
      expect(levelPassThreshold(12)).toBe(10);
    });

    it("80% of 6 is 4.8, needs 5 - the Vocabulary HSK5-9 case with 3/category", () => {
      expect(levelPassThreshold(6)).toBe(5);
    });

    it("would need 100% at exactly 4 questions - why Vocabulary HSK5-9 uses 3/category, not 2", () => {
      expect(levelPassThreshold(4)).toBe(4);
    });
  });

  describe("levelGateStatus", () => {
    // 2 categories, 2 questions each (Grammar-shaped: 6 cat is realistic,
    // but 2 keeps fixtures short - the math only depends on counts).
    const questions = new Map(
      [
        question("n1", 1, "noun", "GRAMMAR"), question("n2", 1, "noun", "GRAMMAR"),
        question("v1", 1, "verb", "GRAMMAR"), question("v2", 1, "verb", "GRAMMAR"),
      ].map((q) => [q.id, q]),
    );

    it("is pending until every category has its required number of attempts", () => {
      const attempts = [attempt("n1", true, 1), attempt("n2", true, 2)]; // verb untouched
      const progress = computeCategoryProgress(attempts, questions);
      expect(levelGateStatus(progress, "GRAMMAR", 1, ["noun", "verb"])).toBe("pending");
    });

    it("passes once complete and at/above the 80% threshold (3/4 = 75%, need 4 -> fails at 3)", () => {
      // 4 total questions, threshold = ceil(4*0.8) = 4, so 3/4 correct must fail.
      const attempts = [
        attempt("n1", true, 1), attempt("n2", true, 2),
        attempt("v1", true, 3), attempt("v2", false, 4),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(levelGateStatus(progress, "GRAMMAR", 1, ["noun", "verb"])).toBe("failed");
    });

    it("passes at exactly the threshold (4/4)", () => {
      const attempts = [
        attempt("n1", true, 1), attempt("n2", true, 2),
        attempt("v1", true, 3), attempt("v2", true, 4),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(levelGateStatus(progress, "GRAMMAR", 1, ["noun", "verb"])).toBe("passed");
    });

    it("a level with no categories in the bank is pending, not passed", () => {
      const progress = computeCategoryProgress([], questions);
      expect(levelGateStatus(progress, "GRAMMAR", 99, [])).toBe("pending");
    });

    describe("early exit (2026-08-19) - resolves before every category is fully attempted, once the outcome can no longer change", () => {
      // 3 categories, 2 questions each = 6 total, threshold = ceil(6*0.8) = 5
      // - room to demonstrate early pass/fail with attempts left unasked.
      const threeCategoryQuestions = new Map(
        [
          question("n1", 1, "noun", "GRAMMAR"), question("n2", 1, "noun", "GRAMMAR"),
          question("v1", 1, "verb", "GRAMMAR"), question("v2", 1, "verb", "GRAMMAR"),
          question("a1", 1, "adj", "GRAMMAR"), question("a2", 1, "adj", "GRAMMAR"),
        ].map((q) => [q.id, q]),
      );
      const categories = ["noun", "verb", "adj"];

      it("resolves 'passed' the moment correct answers alone reach the threshold, with questions still unasked", () => {
        // 5 correct out of the first 5 asked (adj's 2nd question never attempted) - already >= threshold 5.
        const attempts = [
          attempt("n1", true, 1), attempt("n2", true, 2),
          attempt("v1", true, 3), attempt("v2", true, 4),
          attempt("a1", true, 5),
        ];
        const progress = computeCategoryProgress(attempts, threeCategoryQuestions);
        expect(levelGateStatus(progress, "GRAMMAR", 1, categories)).toBe("passed");
      });

      it("stays 'pending' one question earlier - 4 correct with 2 remaining could still reach the threshold", () => {
        const attempts = [
          attempt("n1", true, 1), attempt("n2", true, 2),
          attempt("v1", true, 3), attempt("v2", true, 4),
        ];
        const progress = computeCategoryProgress(attempts, threeCategoryQuestions);
        expect(levelGateStatus(progress, "GRAMMAR", 1, categories)).toBe("pending");
      });

      it("resolves 'failed' the moment even a perfect remaining score couldn't reach the threshold", () => {
        // 3 attempted (1 correct, 2 wrong), 3 remain - best possible final
        // score is 1+3=4, short of the 5 needed - guaranteed failed
        // without ever touching the 3rd category.
        const attempts = [
          attempt("n1", true, 1), attempt("n2", false, 2),
          attempt("v1", false, 3),
        ];
        const progress = computeCategoryProgress(attempts, threeCategoryQuestions);
        expect(levelGateStatus(progress, "GRAMMAR", 1, categories)).toBe("failed");
      });

      it("stays 'pending' one wrong answer earlier - best-case remaining could still reach the threshold", () => {
        // 2 attempted (1 correct, 1 wrong), 4 remain - best possible final
        // score is 1+4=5, exactly enough - still mathematically reachable.
        const attempts = [attempt("n1", true, 1), attempt("n2", false, 2)];
        const progress = computeCategoryProgress(attempts, threeCategoryQuestions);
        expect(levelGateStatus(progress, "GRAMMAR", 1, categories)).toBe("pending");
      });
    });
  });

  describe("currentGatedLevel", () => {
    const categoriesByLevel = new Map<number, string[]>([
      [1, ["noun", "verb"]],
      [2, ["noun", "verb"]],
    ]);
    const questions = new Map(
      [1, 2].flatMap((level) => [
        question(`l${level}n1`, level, "noun", "GRAMMAR"), question(`l${level}n2`, level, "noun", "GRAMMAR"),
        question(`l${level}v1`, level, "verb", "GRAMMAR"), question(`l${level}v2`, level, "verb", "GRAMMAR"),
      ]).map((q) => [q.id, q]),
    );

    it("is 0 (Pre-HSK) before any level's gate resolves", () => {
      const progress = computeCategoryProgress([], questions);
      expect(currentGatedLevel(progress, "GRAMMAR", categoriesByLevel)).toBe(0);
    });

    it("climbs to level 1 once its gate passes (4/4)", () => {
      const attempts = [
        attempt("l1n1", true, 1), attempt("l1n2", true, 2),
        attempt("l1v1", true, 3), attempt("l1v2", true, 4),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(currentGatedLevel(progress, "GRAMMAR", categoriesByLevel)).toBe(1);
    });

    it("cannot skip to level 2 without level 1's gate ever being attempted - a gap blocks credit", () => {
      const attempts = [
        attempt("l2n1", true, 1), attempt("l2n2", true, 2),
        attempt("l2v1", true, 3), attempt("l2v2", true, 4),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(currentGatedLevel(progress, "GRAMMAR", categoriesByLevel)).toBe(0);
    });

    it("stays at level 1 if level 2's gate was attempted and failed", () => {
      const attempts = [
        attempt("l1n1", true, 1), attempt("l1n2", true, 2),
        attempt("l1v1", true, 3), attempt("l1v2", true, 4),
        attempt("l2n1", true, 5), attempt("l2n2", false, 6),
        attempt("l2v1", false, 7), attempt("l2v2", false, 8),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(currentGatedLevel(progress, "GRAMMAR", categoriesByLevel)).toBe(1);
    });
  });

  describe("hasGatedSkillStopped", () => {
    const categoriesByLevel = new Map<number, string[]>([[1, ["noun", "verb"]]]);
    const questions = new Map(
      [
        question("n1", 1, "noun", "GRAMMAR"), question("n2", 1, "noun", "GRAMMAR"),
        question("v1", 1, "verb", "GRAMMAR"), question("v2", 1, "verb", "GRAMMAR"),
      ].map((q) => [q.id, q]),
    );

    it("has not stopped while level 1's gate is still pending", () => {
      const attempts = [attempt("n1", true, 1)];
      const progress = computeCategoryProgress(attempts, questions);
      expect(hasGatedSkillStopped(progress, "GRAMMAR", categoriesByLevel)).toBe(false);
    });

    it("has not stopped once level 1 passes - it simply moves on to the next gate", () => {
      const attempts = [
        attempt("n1", true, 1), attempt("n2", true, 2),
        attempt("v1", true, 3), attempt("v2", true, 4),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(hasGatedSkillStopped(progress, "GRAMMAR", categoriesByLevel)).toBe(false);
    });

    it("has stopped once level 1's gate is complete and failed", () => {
      const attempts = [
        attempt("n1", false, 1), attempt("n2", false, 2),
        attempt("v1", false, 3), attempt("v2", true, 4),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(hasGatedSkillStopped(progress, "GRAMMAR", categoriesByLevel)).toBe(true);
    });

    it("has not stopped once the ceiling is reached, even with no more content", () => {
      const attempts = [
        attempt("n1", true, 1), attempt("n2", true, 2),
        attempt("v1", true, 3), attempt("v2", true, 4),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      // maxLevel=1 here means level 1 IS the ceiling for this fixture.
      expect(hasGatedSkillStopped(progress, "GRAMMAR", categoriesByLevel, 1)).toBe(false);
    });
  });

  describe("nextGatedQuestionTarget", () => {
    const categoriesByLevel = new Map<number, string[]>([[1, ["noun", "verb"]]]);
    const questions = new Map(
      [
        question("n1", 1, "noun", "GRAMMAR"), question("n2", 1, "noun", "GRAMMAR"),
        question("v1", 1, "verb", "GRAMMAR"), question("v2", 1, "verb", "GRAMMAR"),
      ].map((q) => [q.id, q]),
    );

    it("starts at level 1's first category when nothing has been attempted", () => {
      const progress = computeCategoryProgress([], questions);
      const target = nextGatedQuestionTarget(progress, "GRAMMAR", categoriesByLevel);
      expect(target).toEqual({ hskLevel: 1, category: "noun" });
    });

    it("balances categories - picks whichever has fewer attempts so far", () => {
      const attempts = [attempt("n1", true, 1)]; // noun: 1 attempt, verb: 0
      const progress = computeCategoryProgress(attempts, questions);
      const target = nextGatedQuestionTarget(progress, "GRAMMAR", categoriesByLevel);
      expect(target).toEqual({ hskLevel: 1, category: "verb" });
    });

    it("moves past a category once it has its required attempt count, regardless of correctness", () => {
      // 3 categories here (not the 2-category fixture above) specifically
      // so one category finishing with a miss doesn't itself trigger the
      // early-exit "guaranteed fail" case this file also tests below -
      // this test is only about category balancing, not early exit.
      const threeCategoryLevel = new Map<number, string[]>([[1, ["noun", "verb", "adj"]]]);
      const threeCategoryQuestions = new Map(
        [
          question("n1", 1, "noun", "GRAMMAR"), question("n2", 1, "noun", "GRAMMAR"),
          question("v1", 1, "verb", "GRAMMAR"), question("v2", 1, "verb", "GRAMMAR"),
          question("a1", 1, "adj", "GRAMMAR"), question("a2", 1, "adj", "GRAMMAR"),
        ].map((q) => [q.id, q]),
      );
      const attempts = [attempt("n1", true, 1), attempt("n2", false, 2)]; // noun done (2/2 attempted, 1 correct - not enough alone to resolve the gate either way
      const progress = computeCategoryProgress(attempts, threeCategoryQuestions);
      const target = nextGatedQuestionTarget(progress, "GRAMMAR", threeCategoryLevel);
      expect(target).toEqual({ hskLevel: 1, category: "verb" });
    });

    it("returns null once the skill has stopped (failed a gate) - no more questions, ever", () => {
      const attempts = [
        attempt("n1", false, 1), attempt("n2", false, 2),
        attempt("v1", false, 3), attempt("v2", true, 4),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(nextGatedQuestionTarget(progress, "GRAMMAR", categoriesByLevel)).toBeNull();
    });

    it("returns null once the pilot ceiling is passed", () => {
      const attempts = [
        attempt("n1", true, 1), attempt("n2", true, 2),
        attempt("v1", true, 3), attempt("v2", true, 4),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(nextGatedQuestionTarget(progress, "GRAMMAR", categoriesByLevel, 1)).toBeNull();
    });
  });

  describe("nextGatedQuestionTargets (batch, 2026-08-19 'agrupar preguntas por pantalla')", () => {
    const categoriesByLevel = new Map<number, string[]>([[1, ["noun", "verb"]]]);
    const questions = new Map(
      [
        question("n1", 1, "noun", "GRAMMAR"), question("n2", 1, "noun", "GRAMMAR"),
        question("v1", 1, "verb", "GRAMMAR"), question("v2", 1, "verb", "GRAMMAR"),
      ].map((q) => [q.id, q]),
    );

    it("fills a batch across categories, balanced the same way as the single-target version", () => {
      const progress = computeCategoryProgress([], questions);
      const targets = nextGatedQuestionTargets(progress, "GRAMMAR", categoriesByLevel, 2);
      expect(targets).toEqual([
        { hskLevel: 1, category: "noun" },
        { hskLevel: 1, category: "verb" },
      ]);
    });

    it("never offers more than a category's required attempt count within one batch", () => {
      // Only 1 category this time, required=2 (questionsPerCategory's
      // default) - a batchSize of 3 must still cap at 2 targets, not
      // overshoot into a 3rd question the category was never sized for.
      const oneCategoryLevel = new Map<number, string[]>([[1, ["noun"]]]);
      const oneCategoryQuestions = new Map(
        [question("n1", 1, "noun", "GRAMMAR"), question("n2", 1, "noun", "GRAMMAR")].map((q) => [q.id, q]),
      );
      const progress = computeCategoryProgress([], oneCategoryQuestions);
      const targets = nextGatedQuestionTargets(progress, "GRAMMAR", oneCategoryLevel, 3);
      expect(targets).toEqual([
        { hskLevel: 1, category: "noun" },
        { hskLevel: 1, category: "noun" },
      ]);
    });

    it("returns fewer than batchSize once the level is nearly exhausted", () => {
      // 3 of 4 slots already attempted (noun done, verb has 1/2) - only 1
      // slot left, so a batchSize of 2 can only return 1 target.
      const attempts = [attempt("n1", true, 1), attempt("n2", true, 2), attempt("v1", true, 3)];
      const progress = computeCategoryProgress(attempts, questions);
      const targets = nextGatedQuestionTargets(progress, "GRAMMAR", categoriesByLevel, 2);
      expect(targets).toEqual([{ hskLevel: 1, category: "verb" }]);
    });

    it("returns an empty batch once the skill has stopped (failed a gate)", () => {
      const attempts = [
        attempt("n1", false, 1), attempt("n2", false, 2),
        attempt("v1", false, 3), attempt("v2", true, 4),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(nextGatedQuestionTargets(progress, "GRAMMAR", categoriesByLevel, 2)).toEqual([]);
    });

    it("returns an empty batch once the pilot ceiling is passed", () => {
      const attempts = [
        attempt("n1", true, 1), attempt("n2", true, 2),
        attempt("v1", true, 3), attempt("v2", true, 4),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(nextGatedQuestionTargets(progress, "GRAMMAR", categoriesByLevel, 2, 1)).toEqual([]);
    });

    it("nextGatedQuestionTarget (singular) always matches the first element of the batch version", () => {
      const progress = computeCategoryProgress([attempt("n1", true, 1)], questions);
      const single = nextGatedQuestionTarget(progress, "GRAMMAR", categoriesByLevel);
      const [first] = nextGatedQuestionTargets(progress, "GRAMMAR", categoriesByLevel, 1);
      expect(single).toEqual(first);
    });
  });

  describe("end-to-end climb, matching this session's worked examples", () => {
    // Mirrors the real HSK1-4 Grammar shape (6 categories) closely enough
    // to exercise realistic rounding, using 2 categories for a compact
    // fixture - the rounding math itself is covered precisely above.
    const categoriesByLevel = new Map<number, string[]>([
      [1, ["noun", "verb"]],
      [2, ["noun", "verb"]],
      [3, ["noun", "verb"]],
    ]);
    function levelQuestions(level: number) {
      return [
        question(`l${level}n1`, level, "noun", "GRAMMAR"),
        question(`l${level}n2`, level, "noun", "GRAMMAR"),
        question(`l${level}v1`, level, "verb", "GRAMMAR"),
        question(`l${level}v2`, level, "verb", "GRAMMAR"),
      ];
    }
    const questions = new Map(
      [1, 2, 3].flatMap((level) => levelQuestions(level)).map((q) => [q.id, q]),
    );

    it("climbs cleanly through every level when every answer is correct", () => {
      const attempts: PlacementAttemptRecord[] = [];
      let seq = 1;
      for (const level of [1, 2, 3]) {
        for (const q of levelQuestions(level)) attempts.push(attempt(q.id, true, seq++));
      }
      const progress = computeCategoryProgress(attempts, questions);
      expect(currentGatedLevel(progress, "GRAMMAR", categoriesByLevel, 3)).toBe(3);
      expect(nextGatedQuestionTarget(progress, "GRAMMAR", categoriesByLevel, 3)).toBeNull();
    });

    it("stops permanently at the level it fails, never asks about a level beyond it", () => {
      const attempts: PlacementAttemptRecord[] = [
        // Level 1: 4/4, passes.
        attempt("l1n1", true, 1), attempt("l1n2", true, 2),
        attempt("l1v1", true, 3), attempt("l1v2", true, 4),
        // Level 2: 3/4 (need 4/4 at this size), fails.
        attempt("l2n1", true, 5), attempt("l2n2", true, 6),
        attempt("l2v1", true, 7), attempt("l2v2", false, 8),
      ];
      const progress = computeCategoryProgress(attempts, questions);
      expect(currentGatedLevel(progress, "GRAMMAR", categoriesByLevel, 3)).toBe(1);
      expect(hasGatedSkillStopped(progress, "GRAMMAR", categoriesByLevel, 3)).toBe(true);
      expect(nextGatedQuestionTarget(progress, "GRAMMAR", categoriesByLevel, 3)).toBeNull();
    });
  });
});
