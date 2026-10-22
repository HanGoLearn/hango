// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { axe } from "jest-axe";
import { JourneyQualityReviewScreen } from "@/components/admin/journey-quality-review-screen";
import type { JourneyQualityReviewView } from "@/lib/journey-speaking-quality-view";
import { JOURNEY_PEDAGOGY_AUDIT_VERSION } from "@/lib/journey-speaking-quality-pedagogy";
afterEach(cleanup);
function view(): JourneyQualityReviewView {
  return {
    attempts: [
      {
        id: "own",
        lessonId: "lesson",
        title: "Saludos",
        date: "2026-10-18T12:00:00Z",
        currentScore: 75,
      },
    ],
    selectedId: "own",
    title: "Saludos",
    turns: [
      { id: "u1", role: "user", content: "我叫是小林。", uncertain: false },
    ],
    state: "NOT_RUN",
    profile: null,
    issues: [],
    usage: null,
  };
}
describe("private read-only review screen", () => {
  it("does not offer paid controls or invent a candidate", () => {
    render(<JourneyQualityReviewScreen view={view()} />);
    expect(screen.getByText("Lectura sin consumo de IA")).toBeVisible();
    expect(
      screen.getAllByText("Sin candidato validado. No es un cero."),
    ).toHaveLength(4);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.getByText("Nota guardada: 75/100 · rúbrica actual"),
    ).toBeVisible();
    expect(
      screen.getByText(/No significa que la conversación sea perfecta/),
    ).toBeVisible();
  });
  it("renders original text safely, including uncertainty and markup-like speech", () => {
    const value = view();
    value.turns[0]!.uncertain = true;
    value.turns[0]!.content = "<script>test</script>";
    const { container } = render(<JourneyQualityReviewScreen view={value} />);
    expect(screen.getByText("<script>test</script>")).toBeVisible();
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText(/Reconocimiento dudoso/)).toBeVisible();
  });
  it("distinguishes missing cost from zero and unvalidated judgments from learner mistakes", () => {
    const value = view();
    value.state = "REJECTED_CANDIDATE";
    value.issues = ["MAXIMUM_WITH_UNRESOLVED_ERROR"];
    render(<JourneyQualityReviewScreen view={value} />);
    expect(screen.getByText("No conciliado")).toBeVisible();
    expect(screen.getByText(/no errores tuyos/)).toBeInTheDocument();
    expect(
      screen.getByText("Candidato rechazado por incoherencias"),
    ).toBeVisible();
  });
  it("has no detected accessibility violations in the empty-candidate state", async () => {
    const { container } = render(<JourneyQualityReviewScreen view={view()} />);
    expect((await axe(container)).violations).toEqual([]);
  });
  it("shows a pedagogical hold and citation gaps, not an approved grade or learner penalty", async () => {
    const value = view();
    value.turns.push({
      id: "u2",
      role: "user",
      content: "你叫什么名字？",
      uncertain: false,
    });
    value.state = "VALIDATED_CANDIDATE";
    value.pedagogy = {
      version: JOURNEY_PEDAGOGY_AUDIT_VERSION,
      decision: "HOLD",
      studentReady: false,
      score: null,
      notices: [
        { code: "ACT_EVIDENCE_MISMATCH", itemId: "finding" },
        { code: "UNCITED_LEARNER_TURNS" },
      ],
      coverage: {
        clearLearnerTurns: 2,
        citedLearnerTurns: 1,
        requiredTargetsConfigured: false,
        turns: [{ turnId: "u1", sequence: 1, status: "UNCITED" }],
      },
      acts: [
        {
          findingId: "finding",
          targetId: "ask-name",
          rule: "greetings-ask-name-v2",
          status: "EVIDENCE_MISMATCH",
          supportingQuotes: [],
          otherSupportedQuotes: [{ turnId: "u2", quote: "你叫什么名字？" }],
        },
      ],
    };
    const { container } = render(<JourneyQualityReviewScreen view={value} />);
    expect(screen.getByText("Retenido para revisión pedagógica")).toBeVisible();
    expect(
      screen.getByText("Intervenciones claras citadas: 1 de 2"),
    ).toBeVisible();
    expect(screen.getByText(/no tu puntuación/)).toBeVisible();
    expect(
      screen.getByText(/no respalda el acto de preguntar el nombre/),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Intervención 2: sin cita/ }),
    ).toHaveAttribute("href", "#quality-turn-u1");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Preguntar el nombre")).toBeInTheDocument();
    expect(
      screen.getByText(/No se añadieron al informe ni modificaron la nota/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Otro fragmento: «你叫什么名字？»" }),
    ).toHaveAttribute("href", "#quality-turn-u2");
    expect((await axe(container)).violations).toEqual([]);
  });
  it("shows grounded criteria, correction and links to original turns without offering new evaluation", async () => {
    const value = view();
    value.state = "VALIDATED_CANDIDATE";
    const dimension = {
      observation: "OBSERVED" as const,
      level: 3,
      support: "OCCASIONAL" as const,
      reason: "Aplicación con ayuda puntual.",
      citations: [{ turnId: "u1", quote: "我叫是小林" }],
    };
    value.profile = {
      version: "journey-quality-candidate-2026-10-18-v1",
      locale: "es",
      status: "CANDIDATE",
      score: null,
      eligibleForRewards: false,
      dimensions: {
        communication: dimension,
        vocabulary: dimension,
        grammar: dimension,
        interaction: dimension,
        pronunciation: { status: "NOT_EVALUATED" },
        fluency: { status: "NOT_EVALUATED" },
      },
      coverage: {
        required: 0,
        independentlyDemonstrated: [],
        assisted: [],
        selfCorrected: [],
        unconfirmed: [],
      },
      limitations: ["NO_CALIBRATED_AUDIO", "HUMAN_CALIBRATION_PENDING"],
      feedback: [
        {
          findingId: "f1",
          targetId: "grammar:called",
          targetText: "我叫 + nombre",
          state: "ERROR",
          label: "Aspecto por corregir",
          resolved: false,
          isPriority: true,
          quotes: [{ turnId: "u1", quote: "我叫是小林" }],
          correction: {
            chinese: "我叫小林。",
            pinyin: "Wǒ jiào Xiǎolín.",
            translation: "Me llamo Xiaolin.",
          },
        },
      ],
    };
    const { container } = render(<JourneyQualityReviewScreen view={value} />);
    expect(screen.getAllByText("3/4")).toHaveLength(4);
    expect(screen.getByText("Wǒ jiào Xiǎolín.")).toBeVisible();
    expect(screen.getByText("Me llamo Xiaolin.")).toBeVisible();
    expect(
      screen.getAllByRole("link", { name: "«我叫是小林»" })[0],
    ).toHaveAttribute("href", "#quality-turn-u1");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect((await axe(container)).violations).toEqual([]);
  });
  it("labels contract intentions and the separate grammar requirement without approving a grade", async () => {
    const value = view();
    value.state = "VALIDATED_CANDIDATE";
    value.pedagogy = {
      version: JOURNEY_PEDAGOGY_AUDIT_VERSION,
      decision: "HOLD",
      studentReady: false,
      score: null,
      coverage: {
        clearLearnerTurns: 1,
        citedLearnerTurns: 1,
        requiredTargetsConfigured: true,
        turns: [],
      },
      notices: [
        {
          code: "ACT_FORM_REQUIREMENT_REQUIRES_SEPARATE_REVIEW",
          itemId: "scope",
        },
      ],
      acts: [
        {
          findingId: "scope",
          targetId: "act:scope",
          rule: "contract-ask-scope-v1",
          status: "PATTERN_SUPPORTED",
          supportingQuotes: [],
          otherSupportedQuotes: [],
        },
      ],
    };
    const { container } = render(<JourneyQualityReviewScreen view={value} />);
    expect(
      screen.getByText("Consultar el alcance de la cláusula"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /lograr la intención comunicativa no demuestra por sí solo esa forma gramatical/,
      ),
    ).toBeVisible();
    expect(
      screen.getByText("Patrón localizado · no es aprobación docente"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect((await axe(container)).violations).toEqual([]);
  });
});
