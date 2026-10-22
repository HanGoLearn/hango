import "server-only";
import {
  getJourneySpeakingAttempt,
  JourneyAttemptConflictError,
} from "@/lib/journey-speaking-attempts";
import {
  JOURNEY_RUBRIC_VERSION,
  type JourneyAttemptSnapshot,
} from "@/lib/journey-speaking-attempt-contract";
import type { RolePlayContext } from "@/lib/ai-context";
import { buildJourneyAudioLessonContext } from "@/lib/journey-speaking-level";

/** Binding is optional during rollout, but a provided ID is never ignored. */
export async function getJourneyRealtimeBinding(
  userId: string,
  attemptId: string,
  lessonId: string,
) {
  const attempt = await getJourneySpeakingAttempt(userId, attemptId, lessonId);
  const snapshot = attempt.snapshot as unknown as JourneyAttemptSnapshot;
  if (
    attempt.status !== "ACTIVE" ||
    attempt.rubricVersion !== JOURNEY_RUBRIC_VERSION ||
    attempt.bankVersion !== snapshot.banks.version ||
    Date.now() - attempt.startedAt.getTime() >= 20 * 60 * 1000
  )
    throw new JourneyAttemptConflictError("Active Journey attempt unavailable");
  const rolePlay: RolePlayContext = {
    aiRole: snapshot.aiRole,
    learnerRole: snapshot.learnerRole,
    scenarioContext: snapshot.scenarioContext ?? snapshot.objective,
    objective: snapshot.objective,
    lessonHskLevel: snapshot.hskReference ?? undefined,
    ...(snapshot.speakingLevel ? { journeyLevel: snapshot.speakingLevel } : {}),
    lessonVocabulary: [
      ...snapshot.banks.core.vocabulary,
      ...snapshot.banks.support.vocabulary,
      ...snapshot.banks.extension.vocabulary,
    ].map((item) => item.text),
    lessonGrammar: [
      ...snapshot.banks.core.grammar,
      ...snapshot.banks.support.grammar,
      ...snapshot.banks.extension.grammar,
    ].map((item) => item.text),
    lessonPhrases: snapshot.banks.phraseBank,
  };
  return {
    attemptId: attempt.id,
    locale: attempt.locale,
    rolePlay,
    banks: snapshot.banks,
    audioContext: buildJourneyAudioLessonContext(
      snapshot,
      attempt.snapshotHash,
    ),
  };
}
