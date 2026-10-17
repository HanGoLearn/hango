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
  it("keeps detailed counts and criteria collapsed, one feedback panel", () => {
    const { container } = render(<JourneyFinalReport report={report("es")} />);
    const details = container.querySelectorAll("details");
    expect(details).toHaveLength(1);
    expect(details[0]).not.toHaveAttribute("open");
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
    expect(screen.getByText("Nota global: —")).toBeInTheDocument();
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
    expect(screen.getByText("Nota global: 93/100")).toBeInTheDocument();
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
    expect(screen.getByText("Nota global: —")).toBeInTheDocument();
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
    expect(screen.getByText("Overall score: —")).toBeInTheDocument();
    expect(
      screen.getByText("In assessed exercises: 3 of 3 answers correct."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/system failure, not your mistake/),
    ).toBeInTheDocument();
  });
});
