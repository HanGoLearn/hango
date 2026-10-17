// Synthetic examples only. No user data, provider calls, actions or database.
import {
  buildJourneyLessonReport,
  JOURNEY_LESSON_REPORT_VERSION,
} from "@/lib/journey-lesson-report";
import { JOURNEY_RUBRIC_VERSION } from "@/lib/journey-speaking-attempt-contract";
import type { JourneyEvaluationReport } from "@/lib/journey-speaking-evaluation";
import type { AppLocale } from "@/i18n/config";

export function createJourneyReportPreview(locale: AppLocale, complete = true) {
  const es = locale === "es";
  const observed = {
    observation: "OBSERVED" as const,
    level: 3,
    reason: es
      ? "En este ejemplo el alumno puede presentarse y responder a su compañero."
      : "In this example the learner introduces themselves and responds to their classmate.",
    citations: [{ turnId: "demo-user-2", quote: "我是老师。" }],
  };
  const speaking: JourneyEvaluationReport = {
    rubricVersion: JOURNEY_RUBRIC_VERSION,
    bankVersion: "synthetic-preview",
    locale,
    dimensions: {
      communication: observed,
      language: observed,
      interaction: observed,
      autonomy: observed,
    },
    evidence: [],
    limitations: [],
    score: 75,
    status: "COMPLETE",
    pronunciation: {
      status: "NOT_EVALUATED",
      reason: "NO_VERIFIED_ACOUSTIC_MEASUREMENT",
    },
    feedback: {
      summary: es
        ? "Lograste presentarte y mantener un intercambio sencillo con tu compañero."
        : "You introduced yourself and kept a simple exchange going with your classmate.",
      achievement: {
        text: es
          ? "Usaste 我叫 para tu nombre y 我是 para decir que eres profesor."
          : "You used 我叫 for your name and 我是 to say you are a teacher.",
        citations: observed.citations,
      },
      priority: {
        kind: "practice",
        text: es
          ? "Ahora une tu nombre y tu ocupación en una presentación breve, sin ayuda."
          : "Next, combine your name and occupation into a short introduction without help.",
        citations: [],
        example: {
          chinese: "你好，我叫安娜。我是老师。",
          pinyin: "Nǐ hǎo, wǒ jiào Ānnà. Wǒ shì lǎoshī.",
          translation: es
            ? "Hola, me llamo Ana. Soy profesora."
            : "Hello, my name is Ana. I am a teacher.",
        },
      },
      nextStep: es
        ? "Preséntate a otro compañero usando esas dos estructuras."
        : "Introduce yourself to another classmate using those two structures.",
    },
  };
  const answers = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      key: `demo-question-${index}`,
      attemptId: `demo-answer-${index}`,
      result: true,
    }));
  const result = buildJourneyLessonReport(
    "synthetic-demo",
    locale,
    {
      version: JOURNEY_LESSON_REPORT_VERSION,
      progressId: "synthetic-demo-run",
      progressStartedAt: "2026-10-11T12:00:00.000Z",
      capturedAt: "2026-10-11T12:01:00.000Z",
      vocabulary: answers(10),
      grammar: answers(6),
      comprehension: answers(5),
    },
    complete ? "COMPLETE" : "INSUFFICIENT",
    complete ? speaking : null,
  );
  if (!complete) result.speaking.reason = "TECHNICAL_CAPTURE";
  return result;
}
