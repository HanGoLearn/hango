// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));
// See tests/component/shell.test.tsx for why these are mocked here.
vi.mock("@/lib/actions/logout", () => ({ logoutAction: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/ai-teacher-data", () => ({
  getConversationHistory: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/actions/ai-teacher", () => ({
  sendAiTeacherMessageAction: vi.fn(),
  resetAiTeacherConversationAction: vi.fn(),
  transcribeHanMessageAction: vi.fn(),
}));
vi.mock("@/lib/actions/onboarding", () => ({
  saveGoalStepAction: vi.fn(),
  saveLevelStepAction: vi.fn(),
  saveExplanationLanguageStepAction: vi.fn(),
  saveSkillsStepAction: vi.fn(),
  saveDailyTargetStepAction: vi.fn(),
  saveAiPreferencesStepAction: vi.fn(),
  completeOnboardingAction: vi.fn(),
}));

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Toggle } from "@/components/ui/toggle";
import { InformationBanner } from "@/components/ui/banner";
import { EmptyState } from "@/components/ui/states";
import { AppShell } from "@/components/shell/app-shell";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

afterEach(() => {
  cleanup();
});

describe("Accessibility (axe)", () => {
  it("Button has no violations", async () => {
    const { container } = render(<Button>Continue</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Input with label and error has no violations", async () => {
    const { container } = render(
      <Input label="Email" error="Email is required" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Checkbox with label has no violations", async () => {
    const { container } = render(<Checkbox label="Show Pinyin" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Toggle with label has no violations", async () => {
    const { container } = render(<Toggle label="Automatic playback" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("InformationBanner has no violations", async () => {
    const { container } = render(
      <InformationBanner variant="warning" title="Heads up">
        Your session will expire soon.
      </InformationBanner>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("EmptyState as a full page (h1) has no violations", async () => {
    const { container } = render(
      <EmptyState
        headingLevel="h1"
        title="Dashboard"
        description="Nothing here yet."
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("AppShell (full layout) has no violations", async () => {
    const { container } = render(
      await AppShell({
        children: (
          <EmptyState
            headingLevel="h1"
            title="Dashboard"
            description="Nothing here yet."
          />
        ),
      }),
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("OnboardingWizard (goal step — checkbox group) has no violations", async () => {
    const { container } = render(
      <OnboardingWizard
        initialStep="goal"
        initialValues={{
          displayName: "Ana",
          nickname: "ana123",
          avatarAnimal: "RABBIT",
          learningGoals: [],
          currentLevel: null,
          explanationLanguage: null,
          skillPriorities: [],
          dailyStudyTargetMinutes: null,
        }}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("OnboardingWizard (avatar step — grid of selectable/locked buttons) has no violations", async () => {
    const { container } = render(
      <OnboardingWizard
        initialStep="avatar"
        initialValues={{
          displayName: "Ana",
          nickname: "ana123",
          avatarAnimal: null,
          learningGoals: [],
          currentLevel: null,
          explanationLanguage: null,
          skillPriorities: [],
          dailyStudyTargetMinutes: null,
        }}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
