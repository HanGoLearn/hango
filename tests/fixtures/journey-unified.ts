import { JOURNEY_BANK_VERSION } from "@/lib/content/journey-speaking-bank-contract";
import { JOURNEY_QUALITY_CANDIDATE_VERSION } from "@/lib/journey-speaking-quality-candidate";
import {
  JOURNEY_EVIDENCE_TRANSPORT_VERSION,
  prepareJourneyQualityEvidenceReview,
} from "@/lib/journey-speaking-quality-evidence-review";
import { JOURNEY_UNIFIED_POLICY } from "@/lib/journey-unified-policy";
import {
  JOURNEY_LESSON_REPORT_VERSION,
  type JourneyAssessmentSnapshot,
} from "@/lib/journey-lesson-report";
import {
  JOURNEY_SESSION_AUDIO_VERSION,
  type JourneySessionAudioResult,
} from "@/lib/journey-session-audio-review";
import type { JourneyEvaluationContext } from "@/lib/journey-speaking-evaluation";
import { buildJourneyUnifiedView } from "@/lib/journey-unified-speaking";
import { sessionAudioJudgment } from "./journey-session-audio";

/** Wholly fictional evidence, not a recording or proof of grading accuracy. */
export function unifiedContext(
  locale: "es" | "en" = "es",
): JourneyEvaluationContext {
  const entry = {
    id: "word",
    lessonId: "lesson",
    lessonSlug: "greetings",
    text: "叫",
    meaning: "llamarse",
    evidence: "not-observed" as const,
  };
  return {
    locale,
    closeReason: "USER_END",
    snapshot: {
      evaluationPolicy: JOURNEY_UNIFIED_POLICY,
      lessonId: "lesson",
      lessonSlug: "greetings",
      lessonTitle: "Saludos",
      difficulty: "BEGINNER",
      hskReference: 1,
      aiRole: "Compañero",
      learnerRole: "Tú",
      objective: "Presentarse",
      successConditions: [
        { id: "name", text: "Give your name" },
        { id: "ask", text: "Ask their name" },
      ],
      banks: {
        version: JOURNEY_BANK_VERSION,
        lessonId: "lesson",
        lessonSlug: "greetings",
        openingLine: "你好",
        rationale: "Saludar",
        core: {
          vocabulary: [entry],
          grammar: [{ ...entry, id: "pattern", text: "Subject + 叫 + Name" }],
        },
        support: { vocabulary: [], grammar: [] },
        extension: { vocabulary: [], grammar: [] },
        phraseBank: [],
        reviewIssues: [],
      },
    },
    quality: { pendingLearnerTurn: false, interruptedAssistant: false },
    turns: [
      {
        id: "partner",
        sequence: 0,
        role: "assistant",
        content: "你叫什么名字？",
      },
      { id: "learner", sequence: 1, role: "user", content: "我叫小林。" },
    ],
  };
}

/** Deterministic mock transport for real service tests; never sends a request. */
export function unifiedWire(input: string) {
  const data = JSON.parse(input) as {
    attemptId: string;
    locale: "es" | "en";
    turns: { id: string }[];
    partnerContext: { id: string }[];
    targets: {
      id: string;
      kind: string;
      eligibleLearnerEvidenceIds: string[];
    }[];
  };
  const dimension = {
    observation: "OBSERVED",
    level: 3,
    support: "NONE",
    reason:
      data.locale === "es"
        ? "Ejemplo ficticio: respuesta funcional; falta ampliar la información."
        : "Fictional example: functional reply; information could be expanded.",
    learnerEvidenceIds: [data.turns[0]!.id],
    partnerEvidenceIds: [] as string[],
  };
  return {
    version: JOURNEY_QUALITY_CANDIDATE_VERSION,
    transportVersion: JOURNEY_EVIDENCE_TRANSPORT_VERSION,
    attemptId: data.attemptId,
    locale: data.locale,
    dimensions: {
      communication: structuredClone(dimension),
      vocabulary: structuredClone(dimension),
      grammar: structuredClone(dimension),
      interaction: {
        ...structuredClone(dimension),
        partnerEvidenceIds: [data.partnerContext[0]!.id],
      },
      pronunciation: { status: "NOT_EVALUATED" },
      fluency: { status: "NOT_EVALUATED" },
    },
    findings: data.targets
      .filter(
        (target) =>
          target.eligibleLearnerEvidenceIds.length > 0 &&
          (target.kind !== "act" ||
            target === data.targets.find((item) => item.kind === "act")),
      )
      .slice(0, 12)
      .map((target, index) => ({
        id: `finding-${index}`,
        targetId: target.id,
        state: "INDEPENDENT",
        opportunity: "OFFERED",
        learnerEvidenceIds: [target.eligibleLearnerEvidenceIds[0]!],
        partnerEvidenceIds: [] as string[],
        reason: dimension.reason,
        resolutionId: null as string | null,
        correction: null as {
          chinese: string;
          pinyin: string;
          translation: string;
        } | null,
      })),
  };
}

export function unifiedInspection(context = unifiedContext()) {
  const prepared = prepareJourneyQualityEvidenceReview({
    attemptId: "attempt",
    locale: context.locale,
    snapshot: context.snapshot,
    requiredActIds: ["name", "ask"],
    capture: {
      attemptId: "attempt",
      lessonId: "lesson",
      closeReason: context.closeReason,
      turns: context.turns,
      quality: context.quality,
    },
  });
  const result = prepared.inspectResponse({
    status: "completed",
    text: JSON.stringify(unifiedWire(prepared.request.input)),
  });
  if (result.state !== "VALIDATED_CANDIDATE")
    throw new Error(`Invalid fictional fixture: ${JSON.stringify(result)}`);
  return result;
}
export function unifiedAssessment(): JourneyAssessmentSnapshot {
  const answer = [{ key: "question", attemptId: "answer", result: true }];
  return {
    version: JOURNEY_LESSON_REPORT_VERSION,
    progressId: "run",
    progressStartedAt: "2026-10-21T10:00:00.000Z",
    capturedAt: "2026-10-21T10:01:00.000Z",
    vocabulary: structuredClone(answer),
    grammar: structuredClone(answer),
    comprehension: structuredClone(answer),
  };
}
export function unifiedAudio(
  locale: "es" | "en" = "es",
): JourneySessionAudioResult {
  const judgment = sessionAudioJudgment(
    "attempt",
    "audio-1",
    1,
    "我叫小林。",
    locale,
  );
  judgment.findings[0]!.target = "我";
  judgment.findings[0]!.pinyin = "wǒ";
  return {
    version: JOURNEY_SESSION_AUDIO_VERSION,
    attemptId: "attempt",
    locale,
    provenance: "UNVERIFIED_BROWSER_REALTIME_REVIEW",
    status: "REVIEWED",
    reason: "COMPLETED",
    totalLearnerTurns: 1,
    submittedItems: [{ sequence: 1, itemId: "audio-1" }],
    judgment,
  };
}
export function unifiedView(locale: "es" | "en" = "es") {
  const context = unifiedContext(locale);
  return buildJourneyUnifiedView({
    locale,
    turns: context.turns,
    assessment: unifiedAssessment(),
    state: "PARTIAL",
    inspection: unifiedInspection(context),
    audio: unifiedAudio(locale),
    technicallyComplete: true,
  });
}
