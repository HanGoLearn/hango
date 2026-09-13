"use server";

import { auth } from "@/lib/auth";
import {
  getOrGenerateScenarioCompletion,
  redoScenario,
  redoLesson,
  ScenarioCompletionNotFoundError,
  type ScenarioCompletionResult,
} from "@/lib/scenario-completion";
import { revalidateLocalizedPath } from "@/i18n/revalidate";

export type ScenarioCompletionActionResult =
  | { ok: true; completion: ScenarioCompletionResult | null }
  | { ok: false; error: string };

export async function getScenarioCompletionAction(
  scenarioId: string,
): Promise<ScenarioCompletionActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in for this." };
  }
  try {
    const completion = await getOrGenerateScenarioCompletion(
      session.user.id,
      scenarioId,
    );
    return { ok: true, completion };
  } catch (error) {
    if (error instanceof ScenarioCompletionNotFoundError) {
      return { ok: false, error: "That scenario couldn't be found." };
    }
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function redoScenarioAction(
  scenarioId: string,
  scenarioSlug: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in for this." };
  }
  try {
    await redoScenario(session.user.id, scenarioId);
    revalidateLocalizedPath(`/learning-journey/${scenarioSlug}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof ScenarioCompletionNotFoundError) {
      return { ok: false, error: "That scenario couldn't be found." };
    }
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function redoLessonAction(
  lessonId: string,
  lessonSlug: string,
  scenarioSlug: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in for this." };
  }
  try {
    await redoLesson(session.user.id, lessonId);
    revalidateLocalizedPath(`/lesson/${lessonSlug}`);
    revalidateLocalizedPath(`/learning-journey/${scenarioSlug}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof ScenarioCompletionNotFoundError) {
      return { ok: false, error: "That lesson couldn't be found." };
    }
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
