import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { registerAction } from "@/lib/actions/register";
import { getLessonBySlug } from "@/lib/content/lesson";
import { getExercisesForLesson } from "@/lib/content/exercise";
import { getQuizzesForLesson } from "@/lib/content/quiz";
import {
  getOrCreateLessonProgress,
  advanceLessonStep,
} from "@/lib/lesson-progress-data";
import { recordExerciseAttempt } from "@/lib/exercise-progress-data";
import type { ExerciseAnswer } from "@/lib/exercise-progress";
import {
  startQuizAttempt,
  submitQuizAnswer,
  completeQuizAttempt,
} from "@/lib/quiz-progress-data";
import {
  createSpeakingSession,
  submitTextFallback as submitSpeakingTextFallback,
  completeSpeakingSession,
} from "@/lib/speaking-data";
import {
  getWritingTasks,
  getOrCreateDraftAttempt,
  saveDraft,
  submitWritingAttempt,
} from "@/lib/writing-data";
import {
  startMissionAttempt,
  sendMissionMessage,
  endMissionAttempt,
} from "@/lib/mission-data";
import { sendAiTeacherMessage } from "@/lib/ai-teacher-data";
import { getDashboardData } from "@/lib/dashboard-data";
import { getCompetencyProgress, getScenarioMastery } from "@/lib/progress-data";

// Only auth() is mocked — everything else runs against the real seeded
// database and mock AI/STT providers, same as the other integration tests.
// This test walks TASKS.md 16.2's "Critical End-to-End Flow" at the service
// layer (no real browser) as the automatable substitute for a true E2E test
// — no browser automation tool (Playwright/Cypress) is set up in this repo.
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

function formDataOf(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const testEmails: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    await db.betaInvitation.deleteMany({
      where: { email: { in: testEmails } },
    });
    testEmails.length = 0;
  }
});

describe("critical end-to-end learner journey (integration, real database)", () => {
  it("register -> onboarding -> lesson -> AI Teacher -> exercises -> speaking -> writing -> quiz -> mission -> progress", async () => {
    const email = `critical-path-${Date.now()}@hango.dev`;
    testEmails.push(email);

    await db.betaInvitation.create({
      data: { email, cohort: "integration-test" },
    });

    // Register.
    const registration = await registerAction(
      { status: "idle" },
      formDataOf({
        name: "Critical Path Learner",
        email,
        password: "correct-horse",
      }),
    );
    expect(registration.status).toBe("success");
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    authMock.mockResolvedValue({ user: { id: user.id } });

    // Onboarding: minimal profile so the lesson/dashboard/progress reads work.
    await db.learnerProfile.create({
      data: {
        userId: user.id,
        interfaceLanguage: "EN",
        explanationLanguage: "EN",
        learningGoals: ["TRAVEL"],
        skillPriorities: ["SPEAKING"],
        dailyStudyTargetMinutes: 20,
        correctionStyle: "IMMEDIATE",
        onboardingCompletedAt: new Date(),
      },
    });

    // Open Dashboard: brand-new learner should be pointed at the first lesson
    // (the Foundations domain, order -1, is the true entry point — it comes
    // before every other domain including Restaurant's "Daily Life").
    const dashboardBefore = await getDashboardData(user.id);
    expect(dashboardBefore.continueTarget?.lessonSlug).toBe(
      "foundations-greetings-and-introductions",
    );

    // Start Lesson.
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    expect(lesson).not.toBeNull();
    const steps = lesson!.steps.map((s) => ({ id: s.id, order: s.order }));
    await getOrCreateLessonProgress(user.id, lesson!.id, steps[0]!.id);

    // Use AI Teacher.
    const aiReply = await sendAiTeacherMessage(
      user.id,
      "How do I ask for a table?",
      { scenarioName: "Restaurant", lessonTitle: lesson!.title },
      "TUTOR",
    );
    expect(aiReply.reply.length).toBeGreaterThan(0);

    // Complete Exercises (server-side grading, real correct options/answers).
    const exercises = await getExercisesForLesson(lesson!.id);
    for (const exercise of exercises) {
      const answer: ExerciseAnswer =
        exercise.type === "FILL_IN_BLANK"
          ? {
              type: "FILL_IN_BLANK",
              text: (exercise.correctAnswer as { accepted: string[] })
                .accepted[0]!,
            }
          : {
              type: exercise.type as "MULTIPLE_CHOICE" | "TRUE_FALSE",
              optionId: exercise.options.find((o) => o.isCorrect)!.id,
            };
      const result = await recordExerciseAttempt(user.id, exercise.id, answer);
      expect(result.isCorrect).toBe(true);
    }

    // Complete Speaking.
    const speakingSession = await createSpeakingSession(
      user.id,
      "GUIDED_CONVERSATION",
      "Order a dish and ask if it's spicy.",
      {},
    );
    await submitSpeakingTextFallback(
      user.id,
      speakingSession.id,
      "我要宫保鸡丁，辣不辣？",
    );
    await completeSpeakingSession(user.id, speakingSession.id);

    // Complete Writing.
    const writingTasks = await getWritingTasks(lesson!.id);
    const writingTask = writingTasks.find((t) => t.lessonId === lesson!.id);
    expect(writingTask).toBeTruthy();
    const draft = await getOrCreateDraftAttempt(user.id, writingTask!.id);
    await saveDraft(user.id, draft.id, "我要一个宫保鸡丁。");
    const submittedWriting = await submitWritingAttempt(user.id, draft.id);
    expect(submittedWriting.feedback).not.toBeNull();

    // Complete Quiz.
    const [quiz] = await getQuizzesForLesson(lesson!.id);
    const quizAttempt = await startQuizAttempt(user.id, quiz!.id);
    for (const question of quiz!.questions) {
      const correctOption = question.options.find((o) => o.isCorrect)!;
      await submitQuizAnswer(user.id, quizAttempt.id, question.id, {
        type: "MULTIPLE_CHOICE",
        optionId: correctOption.id,
      });
    }
    const { attempt: completedQuiz } = await completeQuizAttempt(
      user.id,
      quizAttempt.id,
    );
    expect(completedQuiz.completedAt).not.toBeNull();

    // Complete Mission.
    const mission = await db.mission.findFirstOrThrow({
      where: { lesson: { slug: "restaurant-entering-and-ordering" } },
    });
    const missionAttempt = await startMissionAttempt(user.id, mission.id);
    await sendMissionMessage(
      user.id,
      missionAttempt.id,
      "你好，我们两位，我要宫保鸡丁。",
    );
    const completedMission = await endMissionAttempt(
      user.id,
      missionAttempt.id,
    );
    expect(completedMission.completionState).toBe("COMPLETED");

    // Advance every lesson step so the lesson itself is marked complete.
    for (const step of steps) {
      await advanceLessonStep(user.id, lesson!.id, step.id, undefined);
    }
    const completion = await db.learnerLessonCompletion.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson!.id } },
    });
    expect(completion).not.toBeNull();

    // View Updated Progress: evidence from exercises/speaking/writing/quiz/
    // mission should have produced real competency progress and scenario
    // mastery, and the dashboard should reflect the completed lesson.
    const competencyProgress = await getCompetencyProgress(user.id);
    expect(competencyProgress.length).toBeGreaterThan(0);

    const scenarioMastery = await getScenarioMastery(user.id);
    const restaurant = scenarioMastery.find((m) => m.slug === "restaurant");
    expect(restaurant?.completionPercent).toBeGreaterThan(0);

    const dashboardAfter = await getDashboardData(user.id);
    expect(dashboardAfter.streak.activeToday).toBe(true);
    // 2026-08-19: raised from 20s - Prisma Postgres's serverless connection
    // showed real latency spikes under today's heavy test load (confirmed
    // via timing instrumentation: every step ran slow, not one hung query -
    // an infra/latency issue, not a logic bug from that day's changes).
  }, 60_000);
});
