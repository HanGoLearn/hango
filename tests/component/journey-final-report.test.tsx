// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JourneyFinalReport } from "@/components/lesson/journey-final-report";
import {
  buildJourneyLessonReport,
  JOURNEY_LESSON_REPORT_VERSION,
} from "@/lib/journey-lesson-report";
import { JOURNEY_RUBRIC_VERSION } from "@/lib/journey-speaking-attempt-contract";
import type { JourneyEvaluationReport } from "@/lib/journey-speaking-evaluation";
import { JOURNEY_EVALUATION_POLICY } from "@/lib/journey-evaluation-policy";
import { axe } from "jest-axe";
import {
  JOURNEY_SESSION_AUDIO_VERSION,
  unavailableJourneySessionAudio,
} from "@/lib/journey-session-audio-review";
import { sessionAudioJudgment } from "../fixtures/journey-session-audio";
import { unifiedView } from "../fixtures/journey-unified";
import { buildJourneyUnifiedView } from "@/lib/journey-unified-speaking";
import { unifiedAssessment, unifiedContext } from "../fixtures/journey-unified";
import { buildJourneySpeakingLevel } from "@/lib/journey-speaking-level";
afterEach(cleanup);
function report(locale: "es" | "en", complete = true) {
  const dimension = {
    observation: "OBSERVED" as const,
    level: 3,
    reason: "Respuesta apropiada.",
    citations: [{ turnId: "user", quote: "我叫Ana" }],
  };
  const speaking: JourneyEvaluationReport = {
    rubricVersion: JOURNEY_RUBRIC_VERSION,
    bankVersion: "test",
    locale,
    dimensions: {
      communication: dimension,
      language: dimension,
      interaction: dimension,
      autonomy: dimension,
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
      summary:
        locale === "es" ? "Pudiste presentarte." : "You introduced yourself.",
      achievement: {
        text: locale === "es" ? "Dijiste tu nombre." : "You gave your name.",
        citations: [{ turnId: "user", quote: "我叫Ana" }],
      },
      priority: {
        kind: "practice",
        text: locale === "es" ? "Pregunta su nombre." : "Ask their name.",
        citations: [],
        example: {
          chinese: "你叫什么名字？",
          pinyin: "Nǐ jiào shénme míngzi?",
          translation:
            locale === "es" ? "¿Cómo te llamas?" : "What is your name?",
        },
      },
      nextStep:
        locale === "es"
          ? "Preséntate a otro compañero."
          : "Introduce yourself to another classmate.",
    },
  };
  const answer = [{ key: "question", attemptId: "answer", result: true }];
  return buildJourneyLessonReport(
    "attempt",
    locale,
    {
      version: JOURNEY_LESSON_REPORT_VERSION,
      progressId: "progress",
      progressStartedAt: "2026-10-11T10:00:00.000Z",
      capturedAt: "2026-10-11T10:01:00.000Z",
      vocabulary: answer,
      grammar: answer,
      comprehension: complete
        ? answer
        : [{ key: "short-response", attemptId: "short", result: null }],
    },
    "COMPLETE",
    speaking,
  );
}
describe("ES/EN final report", () => {
  it.each(["es", "en"] as const)(
    "shows a failed evaluation honestly without empty Han praise or a request to repeat (%s)",
    async (locale) => {
      const result = report(locale);
      const context = unifiedContext(locale);
      result.unified = buildJourneyUnifiedView({
        locale,
        turns: context.turns,
        assessment: unifiedAssessment(),
        state: "FAILED",
        audio: unavailableJourneySessionAudio(
          "attempt",
          locale,
          "INVALID_REVIEW",
          1,
        ),
        technicallyComplete: true,
        textIssues: ["INVALID_SCHEMA"],
      });
      const { container } = render(<JourneyFinalReport report={result} />);
      expect(
        screen.getByRole("status", {
          name: locale === "es" ? "Estado de las revisiones" : "Review status",
        }),
      ).toBeVisible();
      expect(
        screen.queryByRole("region", {
          name: locale === "es" ? "Una nota de Han" : "A note from Han",
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(
          locale === "es" ? /no es una nota cero/ : /neither a zero grade/,
        ),
      ).toBeVisible();
      expect(
        screen.getByText(
          locale === "es" ? "Vocabulario: 100/100" : "Vocabulary: 100/100",
        ),
      ).toBeVisible();
      expect((await axe(container)).violations).toEqual([]);
    },
  );
  it.each(["es", "en"] as const)(
    "renders ONE real integrated reflection with six criteria, exercise grades, tone corrections and no legacy duplicate (%s)",
    async (locale) => {
      const result = report(locale);
      result.unified = unifiedView(locale);
      result.unified.level = buildJourneySpeakingLevel(1, "BEGINNER", 350);
      const before = structuredClone(result);
      const { container, rerender } = render(
        <JourneyFinalReport report={result} />,
      );
      expect(
        screen.getByRole("region", {
          name:
            locale === "es"
              ? "Reflexión integrada de la lección"
              : "Integrated lesson reflection",
        }),
      ).toBeVisible();
      expect(
        screen.getByRole("group", {
          name:
            locale === "es"
              ? "Nota provisional de la lección: 93/100"
              : "Provisional lesson score: 93/100",
        }),
      ).toBeVisible();
      expect(container.querySelectorAll("details")).toHaveLength(7);
      expect(
        screen.getByRole("region", {
          name:
            locale === "es" ? "Nivel de este intento" : "This attempt's level",
        }),
      ).toHaveTextContent("350");
      expect(
        screen.getAllByRole("region", {
          name: locale === "es" ? "Una nota de Han" : "A note from Han",
        }),
      ).toHaveLength(1);
      expect(screen.getByText("wǒ")).toBeVisible();
      expect(
        screen.queryByText(/^(Autonomía|Autonomy)$/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("region", {
          name:
            locale === "es"
              ? "Tu pronunciación, tonos y ritmo"
              : "Your pronunciation, tones and rhythm",
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(
          locale === "es" ? /no.*concede puntos/ : /does not.*grant points/,
        ),
      ).toBeVisible();
      expect((await axe(container)).violations).toEqual([]);
      rerender(<JourneyFinalReport report={result} />);
      expect(result).toEqual(before);
    },
  );
  it("explains an incomplete integrated result without inventing a grade or hiding quiz results", () => {
    const result = report("es");
    result.unified = {
      ...unifiedView(),
      lessonScore: null,
      speakingScore: null,
      holds: ["Falta la revisión de audio."],
      phase: "PARTIAL",
    };
    render(<JourneyFinalReport report={result} />);
    expect(
      screen.getByRole("group", { name: "Nota provisional de la lección: —" }),
    ).toBeVisible();
    expect(screen.getByText("Falta la revisión de audio.")).toBeVisible();
    expect(screen.getByText("Vocabulario: 100/100")).toBeVisible();
    expect(screen.queryByText(/Conversación: 0\/100/)).not.toBeInTheDocument();
  });
  it.each(["es", "en"] as const)(
    "shows saved provisional audio observations without replacing or inflating the linguistic score (%s)",
    async (locale) => {
      const result = report(locale);
      result.speaking.sessionAudio = {
        version: JOURNEY_SESSION_AUDIO_VERSION,
        attemptId: "attempt",
        locale,
        provenance: "UNVERIFIED_BROWSER_REALTIME_REVIEW",
        status: "REVIEWED",
        reason: "COMPLETED",
        totalLearnerTurns: 1,
        submittedItems: [{ sequence: 1, itemId: "audio-1" }],
        judgment: sessionAudioJudgment(
          "attempt",
          "audio-1",
          1,
          "你好，我叫小明。",
          locale,
        ),
      };
      const before = structuredClone(result);
      const { container, rerender } = render(
        <JourneyFinalReport report={result} />,
      );
      expect(
        screen.getByRole("region", {
          name:
            locale === "es"
              ? "Tu pronunciación, tonos y ritmo"
              : "Your pronunciation, tones and rhythm",
        }),
      ).toBeVisible();
      expect(screen.getAllByText("3/4 · provisional")).toHaveLength(3);
      expect(screen.getByText("nǐ")).toBeVisible();
      expect(
        screen.getByText(
          locale === "es"
            ? /no están calibrados con docentes/
            : /not teacher-calibrated/,
        ),
      ).toBeVisible();
      expect(
        screen.getByText(
          locale === "es" ? "Conversación: 75/100" : "Conversation: 75/100",
        ),
      ).toBeVisible();
      expect(
        screen.queryByRole("button", { name: /audio|replay/i }),
      ).not.toBeInTheDocument();
      expect((await axe(container)).violations).toEqual([]);
      rerender(<JourneyFinalReport report={result} />);
      expect(result).toEqual(before);
    },
  );
  it("shows an audio failure without erasing the saved language feedback or inventing a zero", () => {
    const result = report("es");
    result.speaking.sessionAudio = unavailableJourneySessionAudio(
      "attempt",
      "es",
      "TIMEOUT",
      1,
    );
    render(<JourneyFinalReport report={result} />);
    expect(screen.getByText(/superó el tiempo de espera/)).toBeVisible();
    expect(screen.getByText("Pudiste presentarte.")).toBeVisible();
    expect(screen.getAllByText("Sin evaluar")).toHaveLength(3);
    expect(screen.queryByText("0/4")).not.toBeInTheDocument();
  });
  it.each(["es", "en"] as const)(
    "explains excluded speech visibly without hiding the valid score (%s)",
    (locale) => {
      const result = report(locale);
      result.speaking.report!.evaluationPolicy = JOURNEY_EVALUATION_POLICY;
      result.speaking.report!.limitations = [
        {
          kind: "recognition_uncertain",
          reason: "Recognition detail",
          citations: [],
        },
      ];
      render(<JourneyFinalReport report={result} />);
      expect(
        screen.getByText(
          locale === "es"
            ? /Evaluamos tus intervenciones claras/
            : /We assess your clear turns/,
        ),
      ).toBeVisible();
      expect(
        screen.getByText(
          locale === "es" ? "Conversación: 75/100" : "Conversation: 75/100",
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByLabelText(
          locale === "es" ? "Nota global: —" : "Overall score: —",
        ),
      ).not.toBeInTheDocument();
    },
  );
  it("shows the criteria while keeping their evidence collapsed, one feedback panel", () => {
    const { container } = render(<JourneyFinalReport report={report("es")} />);
    const details = container.querySelectorAll("details");
    expect(details).toHaveLength(8);
    for (const detail of details) expect(detail).not.toHaveAttribute("open");
    expect(screen.getByText("30 de 40 puntos")).toBeVisible();
    expect(screen.getAllByText("Sin evaluar")).toHaveLength(3);
    expect(screen.getAllByText("Lo que hiciste bien")).toHaveLength(1);
    expect(
      screen.queryByText("Errores de expresión oral"),
    ).not.toBeInTheDocument();
  });
  it("explains a technical capture without blaming the learner", () => {
    const result = report("es", false);
    result.speaking = {
      state: "INSUFFICIENT",
      score: null,
      report: null,
      reason: "TECHNICAL_CAPTURE",
    };
    render(<JourneyFinalReport report={result} />);
    expect(
      screen.getByText(/La captura oral no se completó/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/conversación oral más larga/),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nota global: —")).toBeInTheDocument();
  });
  it.each(["es", "en"] as const)(
    "shows confirmed settlement in %s, not a promised extra payment",
    (locale) => {
      const settled = report(locale);
      settled.rewards.settlement = "SETTLED";
      render(<JourneyFinalReport report={settled} />);
      expect(
        screen.getByText(
          locale === "es"
            ? /Resultado guardado y recompensas procesadas/
            : /Result saved and rewards processed/,
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(
          locale === "es"
            ? /se confirmarán después/
            : /will be confirmed after/,
        ),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/\+3 HanCoins/)).not.toBeInTheDocument();
    },
  );
  it("presents one achievement, priority and next step, with Mandarin/pinyin/translation", () => {
    render(<JourneyFinalReport report={report("es")} />);
    expect(
      screen.getByRole("region", { name: "Tu resultado de la lección" }),
    ).toHaveAttribute("lang", "es");
    expect(screen.getByLabelText("Nota global: 93/100")).toBeInTheDocument();
    expect(screen.getAllByText("Lo que hiciste bien")).toHaveLength(1);
    expect(screen.getAllByText("Tu siguiente mejora")).toHaveLength(1);
    expect(screen.getByText("你叫什么名字？")).toHaveAttribute("lang", "zh");
    expect(screen.getByText("Nǐ jiào shénme míngzi?")).toBeInTheDocument();
    expect(screen.getByText("¿Cómo te llamas?")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(/HanCoins otorgados/)).not.toBeInTheDocument();
  });
  it("shows missing assessment as partial, no global zero/stars or acoustic percentage", () => {
    const { container } = render(
      <JourneyFinalReport report={report("es", false)} />,
    );
    expect(screen.getByLabelText("Nota global: —")).toBeInTheDocument();
    expect(screen.getByText("Resultado parcial")).toBeInTheDocument();
    expect(screen.queryByText(/^Estrellas:/)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Los tonos y la pronunciación no se puntúan desde una transcripción.",
      ),
    ).toBeInTheDocument();
    expect(container.querySelector("audio")).toBeNull();
    expect(screen.getAllByText("Pendientes de evaluar")).toHaveLength(3);
  });
  it("uses English copy and stored English feedback without a translation call", () => {
    render(<JourneyFinalReport report={report("en")} />);
    expect(
      screen.getByRole("region", { name: "Your lesson result" }),
    ).toHaveAttribute("lang", "en");
    expect(screen.getByText("You introduced yourself.")).toBeInTheDocument();
    expect(screen.getByText("What is your name?")).toBeInTheDocument();
    expect(
      screen.queryByText("Tu resultado de la lección"),
    ).not.toBeInTheDocument();
  });
  it("renders failed evaluation distinctly without fabricated praise or learner error", () => {
    const failed = report("en");
    failed.speaking = { state: "FAILED", score: null, report: null };
    failed.overall = { state: "PARTIAL", score: null, stars: null };
    failed.rewards.eligible = false;
    render(<JourneyFinalReport report={failed} />);
    expect(
      screen.getByText(/HanGo could not validate its evaluation/),
    ).toBeInTheDocument();
    expect(screen.queryByText("What you did well")).not.toBeInTheDocument();
    expect(
      screen.queryByText("You introduced yourself."),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Overall score: —")).toBeInTheDocument();
    expect(
      screen.getByText("In assessed exercises: 3 of 3 answers correct."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/system failure, not your mistake/),
    ).toBeInTheDocument();
  });
  it.each(["es", "en"] as const)(
    "keeps the integrated report accessible (%s)",
    async (locale) => {
      const { container } = render(
        <JourneyFinalReport report={report(locale)} />,
      );
      expect((await axe(container)).violations).toEqual([]);
    },
  );
  it("does not infer separate vocabulary/grammar or acoustic scores from the saved grade", () => {
    const result = report("es");
    result.speaking.report!.dimensions.autonomy = {
      observation: "NOT_OBSERVED",
      level: null,
      reason: "Sin evidencia independiente.",
      citations: [],
    };
    render(<JourneyFinalReport report={result} />);
    expect(
      screen.getByText(/Uso del idioma combina vocabulario y gramática/),
    ).toBeVisible();
    expect(screen.getByText("Sin aporte calculable")).toBeVisible();
    expect(screen.getAllByText("Sin evaluar")).toHaveLength(3);
    expect(screen.queryByText(/Audio simulado/)).not.toBeInTheDocument();
    expect(screen.getByText("Conversación: 75/100")).toBeVisible();
  });
});
