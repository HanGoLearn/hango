import { describe, expect, it } from "vitest";
import { buildJourneyUnifiedView } from "@/lib/journey-unified-speaking";
import {
  prepareUnifiedJourneyReview,
  readUnifiedJourneyReview,
} from "@/lib/journey-unified-speaking-server";
import { JOURNEY_UNIFIED_WEIGHTS } from "@/lib/journey-unified-policy";
import { buildJourneySpeakingLevel } from "@/lib/journey-speaking-level";
import {
  unifiedAssessment,
  unifiedAudio,
  unifiedContext,
  unifiedInspection,
  unifiedView,
  unifiedWire,
} from "../fixtures/journey-unified";

function project() {
  const context = unifiedContext();
  return {
    locale: context.locale,
    turns: context.turns,
    assessment: unifiedAssessment(),
    state: "PARTIAL",
    inspection: unifiedInspection(context),
    audio: unifiedAudio(),
    technicallyComplete: true,
  };
}
describe("unified experimental reflection (synthetic evidence, no API)", () => {
  it("consistently holds real mismatched ask-name evidence in score, objective coverage, dimensions and Han's note", () => {
    const context = unifiedContext();
    context.snapshot.lessonSlug = "foundations-greetings-and-introductions";
    context.snapshot.banks.lessonSlug = context.snapshot.lessonSlug;
    context.snapshot.successConditions = [
      { id: "ask", text: "Ask their name" },
    ];
    const prepared = prepareUnifiedJourneyReview("attempt", context);
    const wire = unifiedWire(prepared.request.input);
    wire.dimensions.communication.reason =
      "Has preguntado su nombre de forma independiente.";
    const saved = prepared.store({
      status: "completed",
      text: JSON.stringify(wire),
    });
    const checked = prepared.inspect(saved);
    expect(checked?.state).toBe("VALIDATED_CANDIDATE");
    if (checked?.state !== "VALIDATED_CANDIDATE")
      throw new Error("Invalid synthetic test");
    expect(checked.pedagogy.acts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetId: "act:ask",
          status: "EVIDENCE_MISMATCH",
        }),
      ]),
    );
    context.quality!.sessionAudio = unifiedAudio();
    const view = readUnifiedJourneyReview(
      "attempt",
      context,
      unifiedAssessment(),
      saved,
      "PARTIAL",
    );
    expect(view).toMatchObject({
      phase: "REVIEW_REQUIRED",
      speakingScore: null,
      lessonScore: null,
      coverage: {
        required: 1,
        independent: 0,
        assisted: 0,
        selfCorrected: 0,
        unconfirmed: 1,
      },
    });
    expect(JSON.stringify(view)).not.toContain("Has preguntado su nombre");
    expect(view.dimensions.communication).toMatchObject({
      level: null,
      contribution: null,
    });
    expect(view.dimensions.pronunciation.level).toBe(3);
    expect(
      view.achievements.some((item) => item.text.includes("Ask their name")),
    ).toBe(false);
    // Original paid claim remains intact for free offline diagnosis.
    expect(saved.response.text).toContain("Has preguntado su nombre");
  });
  it("combines six separate variables and quiz scores with one transparent formula, not official rewards", () => {
    const view = unifiedView();
    expect(
      Object.values(JOURNEY_UNIFIED_WEIGHTS).reduce<number>((a, b) => a + b, 0),
    ).toBe(100);
    expect(view).toMatchObject({
      phase: "READY",
      speakingScore: 75,
      lessonScore: 93,
      eligibleForRewards: false,
      experimental: true,
    });
    expect(view.dimensions.vocabulary.contribution).toBe(11.25);
    expect(view.dimensions.grammar.contribution).toBe(15);
    expect(view.coverage).toMatchObject({
      required: 2,
      unconfirmed: 1,
      audioReviewed: 1,
      audioTotal: 1,
    });
    expect(view.corrections[0]).toMatchObject({
      category: "pronunciation",
      pinyin: "wǒ",
    });
    expect(view.hanNote).toContain("我叫小林。");
  });
  it("preserves the underlying calibrator's human HOLD/null rather than relabeling it teacher-approved", () => {
    const input = project();
    const before = structuredClone(input.inspection);
    buildJourneyUnifiedView(input);
    expect(input.inspection).toEqual(before);
    expect(input.inspection.pedagogy).toMatchObject({
      decision: "HOLD",
      studentReady: false,
      score: null,
    });
    expect(input.inspection.inspection.profile.score).toBeNull();
  });
  it("does not substitute transcript, zero or reweighting for missing audio", () => {
    const view = buildJourneyUnifiedView({ ...project(), audio: null });
    expect(view.speakingScore).toBeNull();
    expect(view.lessonScore).toBeNull();
    expect(view.dimensions.grammar.level).toBe(3);
    expect(view.dimensions.pronunciation).toMatchObject({
      level: null,
      contribution: null,
      weight: 25,
    });
    expect(view.holds.length).toBeGreaterThan(0);
  });
  it("does not conflate vocabulary with grammar or tones with articulation", () => {
    const input = project();
    input.inspection.inspection.profile.dimensions.grammar.level = 2;
    input.audio.judgment!.dimensions.tones.level = 1;
    input.audio.judgment!.dimensions.articulation.level = 3;
    const view = buildJourneyUnifiedView(input);
    expect(view.dimensions.grammar.contribution).toBe(10);
    expect(view.dimensions.vocabulary.contribution).toBe(11.25);
    expect(view.dimensions.pronunciation).toMatchObject({
      level: 2,
      contribution: 12.5,
    });
    expect(view.speakingScore).toBe(64);
  });
  it("holds a perfect grade when priority objectives remain unconfirmed", () => {
    const input = project();
    for (const dim of Object.values(
      input.inspection.inspection.profile.dimensions,
    ))
      if ("level" in dim) dim.level = 4;
    for (const dim of Object.values(input.audio.judgment!.dimensions))
      dim.level = 4;
    const view = buildJourneyUnifiedView(input);
    expect(view.speakingScore).toBeNull();
    expect(view.holds.join(" ")).toContain("máximo");
  });
  it("holds contradictory act evidence, without awarding it as an achievement", () => {
    const input = project();
    const finding = input.inspection.inspection.profile.feedback[0]!;
    input.inspection.pedagogy.acts.push({
      findingId: finding.findingId,
      targetId: finding.targetId,
      rule: null,
      status: "EVIDENCE_MISMATCH",
      supportingQuotes: [],
      otherSupportedQuotes: [],
    });
    const view = buildJourneyUnifiedView(input);
    expect(view.phase).toBe("REVIEW_REQUIRED");
    expect(view.speakingScore).toBeNull();
    expect(
      view.achievements.some((a) => a.text.endsWith(finding.targetText)),
    ).toBe(false);
  });
  it("keeps a complete speaking grade but no global grade for unfinished exercises", () => {
    const input = project();
    input.assessment.grammar[0]!.attemptId = null;
    input.assessment.grammar[0]!.result = null;
    const view = buildJourneyUnifiedView(input);
    expect(view.speakingScore).toBe(75);
    expect(view.lessonScore).toBeNull();
  });
  it.each(["PENDING", "PROCESSING", "FAILED"])(
    "provides an explicit %s view without fabricated feedback",
    (state) => {
      const view = buildJourneyUnifiedView({
        ...project(),
        inspection: undefined,
        state,
      });
      expect(view.speakingScore).toBeNull();
      expect(view.achievements).toEqual([]);
      expect(view.hanNote).toContain("Todavía no hay evidencia");
    },
  );
});
describe("saved integrated judgment binding", () => {
  it("freezes progression in new request hashes without silently upgrading historical paid requests", () => {
    const context = unifiedContext();
    const historical = prepareUnifiedJourneyReview("attempt", context);
    const historicalSaved = historical.store({
      status: "completed",
      text: JSON.stringify(unifiedWire(historical.request.input)),
    });
    context.snapshot.speakingLevel = buildJourneySpeakingLevel(
      1,
      "BEGINNER",
      350,
    );
    const current = prepareUnifiedJourneyReview("attempt", context);
    expect(JSON.parse(current.request.input).speakingLevel.generalPoints).toBe(
      350,
    );
    expect(current.request.instructions).toContain("not a native speaker");
    expect(current.inspect(historicalSaved)).toBeNull();
    const saved = current.store({
      status: "completed",
      text: JSON.stringify(unifiedWire(current.request.input)),
    });
    expect(current.inspect(saved)?.state).toBe("VALIDATED_CANDIDATE");
    delete context.snapshot.speakingLevel;
    expect(
      prepareUnifiedJourneyReview("attempt", context).inspect(historicalSaved)
        ?.state,
    ).toBe("VALIDATED_CANDIDATE");
  });
  it("revalidates the saved response against the exact request and capture, and excludes audio from the text judge", () => {
    const context = unifiedContext();
    context.quality!.sessionAudio = unifiedAudio();
    const prepared = prepareUnifiedJourneyReview("attempt", context);
    expect(prepared.request.input).not.toContain("sessionAudio");
    expect(prepared.request.input).not.toContain("UNVERIFIED_BROWSER");
    const saved = prepared.store({
      status: "completed",
      text: JSON.stringify(unifiedWire(prepared.request.input)),
    });
    const view = readUnifiedJourneyReview(
      "attempt",
      context,
      unifiedAssessment(),
      saved,
      "PARTIAL",
    );
    expect(view.speakingScore).toBe(75);
    expect(view).not.toHaveProperty("response");
    expect(
      prepared.inspect({ ...saved, requestHash: "0".repeat(64) }),
    ).toBeNull();
    expect(prepared.inspect({ ...saved, attemptId: "foreign" })).toBeNull();
    expect(prepared.inspect({ ...saved, locale: "en" })).toBeNull();
    expect(prepared.inspect({ ...saved, version: "legacy" })).toBeNull();
    context.turns[1]!.content = "我叫别人。";
    expect(
      prepareUnifiedJourneyReview("attempt", context).inspect(saved),
    ).toBeNull();
  });
  it("does not accept audio bound to a different attempt, or revive a rejected text response", () => {
    const context = unifiedContext();
    context.quality!.sessionAudio = { ...unifiedAudio(), attemptId: "foreign" };
    const prepared = prepareUnifiedJourneyReview("attempt", context);
    const saved = prepared.store({
      status: "completed",
      text: JSON.stringify(unifiedWire(prepared.request.input)),
    });
    expect(
      readUnifiedJourneyReview(
        "attempt",
        context,
        unifiedAssessment(),
        saved,
        "PARTIAL",
      ).speakingScore,
    ).toBeNull();
    const rejected = prepared.store({
      status: "incomplete",
      text: "private truncated text",
    });
    const view = readUnifiedJourneyReview(
      "attempt",
      context,
      unifiedAssessment(),
      rejected,
      "FAILED",
    );
    expect(view.phase).toBe("FAILED");
    expect(JSON.stringify(view)).not.toContain("private truncated");
  });
  it("requires an explicitly frozen new policy and never upgrades a historical snapshot on read", () => {
    const context = unifiedContext();
    delete context.snapshot.evaluationPolicy;
    expect(() => prepareUnifiedJourneyReview("attempt", context)).toThrow(
      "opt into",
    );
  });
});
