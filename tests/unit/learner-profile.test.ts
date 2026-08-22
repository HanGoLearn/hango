import { describe, expect, it } from "vitest";
import { resolveResumeStep } from "@/lib/learner-profile";

const emptyProfile = {
  learningGoals: [] as string[],
  currentLevel: null,
  explanationLanguage: null,
  skillPriorities: [] as string[],
  dailyStudyTargetMinutes: null,
  correctionStyle: null,
};

describe("resolveResumeStep", () => {
  it("resumes at 'welcome' for a brand-new profile (never skips the intro)", () => {
    expect(resolveResumeStep(emptyProfile)).toBe("welcome");
  });

  it("resumes at 'level' once a goal is set", () => {
    expect(
      resolveResumeStep({ ...emptyProfile, learningGoals: ["TRAVEL"] }),
    ).toBe("level");
  });

  it("resumes at 'explanation-language' once level is set", () => {
    expect(
      resolveResumeStep({
        ...emptyProfile,
        learningGoals: ["TRAVEL"],
        currentLevel: "HSK_4",
      }),
    ).toBe("explanation-language");
  });

  it("resumes at 'skills' once explanation language is set", () => {
    expect(
      resolveResumeStep({
        ...emptyProfile,
        learningGoals: ["TRAVEL"],
        currentLevel: "HSK_4",
        explanationLanguage: "EN",
      }),
    ).toBe("skills");
  });

  it("resumes at 'daily-target' once skills are set", () => {
    expect(
      resolveResumeStep({
        ...emptyProfile,
        learningGoals: ["TRAVEL"],
        currentLevel: "HSK_4",
        explanationLanguage: "EN",
        skillPriorities: ["SPEAKING"],
      }),
    ).toBe("daily-target");
  });

  it("resumes at 'ai-preferences' once a daily target is set", () => {
    expect(
      resolveResumeStep({
        ...emptyProfile,
        learningGoals: ["TRAVEL"],
        currentLevel: "HSK_4",
        explanationLanguage: "EN",
        skillPriorities: ["SPEAKING"],
        dailyStudyTargetMinutes: 20,
      }),
    ).toBe("ai-preferences");
  });

  it("resumes at 'recommendation' once everything is answered", () => {
    expect(
      resolveResumeStep({
        ...emptyProfile,
        learningGoals: ["TRAVEL"],
        currentLevel: "HSK_4",
        explanationLanguage: "EN",
        skillPriorities: ["SPEAKING"],
        dailyStudyTargetMinutes: 20,
        correctionStyle: "ONLY_IMPORTANT",
      }),
    ).toBe("recommendation");
  });
});
