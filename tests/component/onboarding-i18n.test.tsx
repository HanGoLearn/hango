// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { saveGoalStepAction, getRecommendationAction } = vi.hoisted(() => ({
  saveGoalStepAction: vi.fn().mockResolvedValue({ status: "idle" }),
  getRecommendationAction: vi.fn(),
}));

vi.mock("@/lib/actions/onboarding", () => ({
  saveProfileStepAction: vi.fn(),
  saveGoalStepAction,
  saveLevelStepAction: vi.fn(),
  saveExplanationLanguageStepAction: vi.fn(),
  saveSkillsStepAction: vi.fn(),
  saveDailyTargetStepAction: vi.fn(),
  acknowledgePlacementOfferAction: vi.fn(),
  getRecommendationAction,
  completeOnboardingAction: vi.fn(),
}));
vi.mock("@/lib/actions/avatar", () => ({ saveAvatarAnimalAction: vi.fn() }));
vi.mock("@/lib/actions/placement-exam", () => ({
  startPlacementExamAction: vi.fn(),
  applyPlacementCreditAction: vi.fn(),
  getPlacementListeningAudioAction: vi.fn(),
  recordPlacementTimeoutAction: vi.fn(),
  submitPlacementAnswerAction: vi.fn(),
  submitPlacementQuestionBlockAction: vi.fn(),
  gradePlacementSpeakingAction: vi.fn(),
}));
vi.mock("@/components/placement/placement-speaking-exam", () => ({
  PlacementSpeakingExam: () => null,
}));

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { messages as spanishMessages } from "@/i18n/messages/es";

const emptyValues = {
  displayName: null,
  nickname: null,
  avatarAnimal: null,
  learningGoals: [] as string[],
  currentLevel: null,
  explanationLanguage: null,
  skillPriorities: [] as string[],
  dailyStudyTargetMinutes: null,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("localized onboarding", () => {
  it("renders the welcome experience in Spanish", () => {
    render(
      <OnboardingWizard
        locale="es"
        messages={spanishMessages.onboarding}
        initialStep="welcome"
        initialValues={emptyValues}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Conoce a Han" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Comenzar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Conversa contigo")).toBeInTheDocument();
  });

  it("sends the route locale with persisted onboarding answers", async () => {
    render(
      <OnboardingWizard
        locale="es"
        messages={spanishMessages.onboarding}
        initialStep="goal"
        initialValues={emptyValues}
      />,
    );

    await userEvent.click(screen.getByRole("checkbox", { name: /Viajar/ }));
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(saveGoalStepAction).toHaveBeenCalledTimes(1);
    const formData = saveGoalStepAction.mock.calls[0]?.[1] as FormData;
    expect(formData.get("locale")).toBe("es");
    expect(formData.getAll("learningGoals")).toEqual(["TRAVEL"]);
  });

  it("does not repeat a domain when it has the same localized name as the scenario", async () => {
    getRecommendationAction.mockResolvedValueOnce({
      primary: {
        scenarioSlug: "getting-started",
        scenarioName: "Primeros pasos",
        domainName: "Fundamentos",
      },
      reason: "Un buen punto de partida.",
      goalMatches: [
        {
          goal: "SPEAK_CONFIDENTLY",
          label: "Hablar con confianza",
          scenarios: [
            {
              scenarioSlug: "making-friends",
              scenarioName: "Hacer amigos",
              domainName: "Hacer amigos",
            },
          ],
        },
      ],
      placementLevel: null,
    });

    render(
      <OnboardingWizard
        locale="es"
        messages={spanishMessages.onboarding}
        initialStep="recommendation"
        initialValues={{
          ...emptyValues,
          currentLevel: "HSK_1_2",
          learningGoals: ["SPEAK_CONFIDENTLY"],
          skillPriorities: ["SPEAKING"],
        }}
      />,
    );

    expect(await screen.findByText("Hacer amigos")).toBeInTheDocument();
    expect(
      screen.queryByText(/Hacer amigos \(Hacer amigos\)/),
    ).not.toBeInTheDocument();
  });
});
