import { describe, expect, it, vi } from "vitest";
import { EDITORIAL_CALIBRATION_ANCHORS } from "../../project/speaking-quality/calibration/editorial-anchors";
import {
  CALIBRATION_DIMENSIONS,
  compareDraftTeacherCalibration,
  makeBlindTeacherPacket,
  type CalibrationSubmission,
} from "@/lib/journey-speaking-teacher-calibration";

const corpus = () => structuredClone(EDITORIAL_CALIBRATION_ANCHORS);
const copies = (): CalibrationSubmission[] =>
  corpus().map((entry) => ({
    caseId: entry.id,
    ratings: entry.editorialReference.ratings,
  }));
describe("teacher calibration preparation, not independent teacher approval", () => {
  it("has 18 synthetic anchors across the three pilots and ordinal bands, with no acoustic grades", () => {
    const data = corpus();
    expect(data).toHaveLength(18);
    expect(new Set(data.map((entry) => entry.lessonSlug)).size).toBe(3);
    expect(
      new Set(
        data.flatMap((entry) =>
          entry.editorialReference.ratings.map((rating) => rating.level),
        ),
      ),
    ).toEqual(new Set([0, 1, 2, 3, 4, null]));
    for (const entry of data) {
      expect(entry.editorialReference.provenance).toBe(
        "CODEX_AI_ASSISTED_DRAFT",
      );
      expect(entry.editorialReference.ratings).toHaveLength(6);
      for (const rating of entry.editorialReference.ratings)
        if (["pronunciation", "fluency"].includes(rating.dimension))
          expect(rating.level).toBeNull();
    }
  });
  it("validates all exact editorial citations and does not approve even a perfect self-comparison", () => {
    const result = compareDraftTeacherCalibration(corpus(), copies());
    expect(result).toMatchObject({
      status: "DRAFT_COMPARISON_NOT_TEACHER_VALIDATION",
      referenceProvenance: "CODEX_AI_ASSISTED_DRAFT",
      independentHumanReviewVerified: false,
      deploymentEligible: false,
      score: null,
    });
    expect(result.dimensions.communication?.exactAgreement).toBe(1);
    expect(result.dimensions.pronunciation?.pairs).toBe(0);
    expect(result.dimensions.pronunciation?.exactAgreement).toBeNull();
    expect(result.dimensions.fluency?.meanAbsoluteError).toBeNull();
  });
  it("removes editorial answers, severity IDs and notes from the randomized-looking reviewer packet", () => {
    const data = corpus(),
      before = JSON.stringify(data);
    const packet = makeBlindTeacherPacket(data),
      text = JSON.stringify(packet);
    expect(packet.cases).toHaveLength(18);
    expect(text).not.toMatch(
      /editorialReference|teachingNote|CODEX_AI_ASSISTED_DRAFT/,
    );
    for (const entry of packet.cases) {
      expect(entry.id).toMatch(/^case-[a-f0-9]{16}$/);
      expect(
        entry.turns.every((turn) => turn.id.startsWith(`${entry.id}-turn-`)),
      ).toBe(true);
      expect(
        entry.ratings.every(
          (rating) => rating.level === null && rating.reason === "",
        ),
      ).toBe(true);
      expect(CALIBRATION_DIMENSIONS).toEqual(
        entry.ratings.map((rating) => rating.dimension),
      );
    }
    expect(JSON.stringify(data)).toBe(before);
    expect(packet.cases.map((entry) => entry.id)).not.toEqual(
      data.map((entry) => entry.id),
    );
    expect(makeBlindTeacherPacket(data)).toEqual(packet);
  });
  it("accepts citations under opaque packet identities without silently inventing or replacing a quote", () => {
    const data = corpus(),
      packet = makeBlindTeacherPacket(data);
    const entry = packet.cases.find((item) =>
      item.turns.some((turn) => turn.role === "user"),
    )!;
    const turn = entry.turns.find((turn) => turn.role === "user")!;
    const result = compareDraftTeacherCalibration(data, [
      {
        caseId: entry.id,
        ratings: [
          {
            dimension: "communication",
            level: 2,
            reason: "Valoración provisional de prueba.",
            citations: [{ turnId: turn.id, quote: turn.content }],
          },
        ],
      },
    ]);
    expect(result.submittedCases).toBe(1);
    expect(result.independentHumanReviewVerified).toBe(false);
  });
  it("rejects a blank packet as a completed rating instead of mistaking its null defaults for judgments", () => {
    const packet = makeBlindTeacherPacket(corpus());
    expect(() =>
      compareDraftTeacherCalibration(corpus(), [
        { caseId: packet.cases[0]!.id, ratings: packet.cases[0]!.ratings },
      ]),
    ).toThrow(/reason/);
  });
  it("does not turn missing submissions/nulls into zeros or false perfect agreement", () => {
    const result = compareDraftTeacherCalibration(corpus(), []);
    expect(result.dimensions.communication).toMatchObject({
      pairs: 0,
      missingRatings: 18,
      exactAgreement: null,
      withinOneAgreement: null,
      meanAbsoluteError: null,
    });
    const submitted = copies();
    submitted[0]!.ratings.find(
      (rating) => rating.dimension === "communication",
    )!.level = null;
    const compared = compareDraftTeacherCalibration(corpus(), submitted);
    expect(
      compared.dimensions.communication?.submittedUnscored,
    ).toBeGreaterThan(0);
    expect(compared.dimensions.communication?.pairs).toBe(14);
  });
  it("reports exact/within-one difference and maxima above the DRAFT without calling them proven model errors", () => {
    const data = corpus().filter((entry) =>
      ["G0", "G3", "G4"].includes(entry.id),
    );
    const submitted = data.map((entry) => ({
      caseId: entry.id,
      ratings: [
        structuredClone(
          entry.editorialReference.ratings.find(
            (rating) => rating.dimension === "communication",
          )!,
        ),
      ],
    }));
    submitted[0]!.ratings[0]!.level = 4;
    submitted[1]!.ratings[0]!.level = 3;
    const compared = compareDraftTeacherCalibration(data, submitted);
    expect(compared.dimensions.communication).toMatchObject({
      pairs: 3,
      exact: 1,
      withinOne: 2,
      maximaAboveDraftReference: 1,
      meanAbsoluteError: 5 / 3,
      meanSignedDifference: 1,
    });
    expect(compared.deploymentEligible).toBe(false);
  });
  it("separates an unreferenced maximum from a known disagreement", () => {
    const data = corpus().filter((entry) => entry.id === "RX");
    const turn = data[0]!.turns.find((turn) => turn.role === "user")!;
    const result = compareDraftTeacherCalibration(data, [
      {
        caseId: "RX",
        ratings: [
          {
            dimension: "communication",
            level: 4,
            reason: "Sonda, no una nota aprobada.",
            citations: [{ turnId: turn.id, quote: turn.content }],
          },
        ],
      },
    ]);
    expect(result.dimensions.communication).toMatchObject({
      pairs: 0,
      referenceUnscored: 1,
      maximaWithoutScoredReference: 1,
      maximaAboveDraftReference: 0,
    });
  });
  it("rejects unknown/duplicate cases, dimensions, forged quotes and unsupported levels", () => {
    expect(() =>
      compareDraftTeacherCalibration(corpus(), [
        { caseId: "unknown", ratings: [] },
      ]),
    ).toThrow(/Unknown/);
    const rows = copies();
    rows.push(rows[0]!);
    expect(() => compareDraftTeacherCalibration(corpus(), rows)).toThrow(
      /duplicate/,
    );
    const duplicate = copies();
    duplicate[0]!.ratings.push(duplicate[0]!.ratings[0]!);
    expect(() => compareDraftTeacherCalibration(corpus(), duplicate)).toThrow(
      /dimension/,
    );
    const quote = copies();
    quote[0]!.ratings[0]!.citations[0]!.quote = "invented";
    expect(() => compareDraftTeacherCalibration(corpus(), quote)).toThrow(
      /citation/,
    );
    const level = copies();
    Object.assign(level[0]!.ratings[0]!, { level: 4.5 });
    expect(() => compareDraftTeacherCalibration(corpus(), level)).toThrow(
      /ordinal/,
    );
    const noEvidence = copies();
    noEvidence[0]!.ratings[0]!.citations = [];
    expect(() => compareDraftTeacherCalibration(corpus(), noEvidence)).toThrow(
      /Learner/,
    );
  });
  it("cannot upgrade AI provenance to human or certify pronunciation from text", () => {
    const data = corpus();
    Object.assign(data[0]!.editorialReference, {
      provenance: "HUMAN_ADJUDICATED",
    });
    expect(() => makeBlindTeacherPacket(data)).toThrow(/provenance/);
    const rows = copies();
    Object.assign(
      rows[0]!.ratings.find((rating) => rating.dimension === "pronunciation")!,
      { level: 4 },
    );
    expect(() => compareDraftTeacherCalibration(corpus(), rows)).toThrow(
      /audio/,
    );
  });
  it("does not award maximum task-grammar coverage when required forms were only paraphrased", () => {
    const entry = corpus().find((entry) => entry.id === "C4")!;
    expect(
      entry.editorialReference.ratings.find(
        (rating) => rating.dimension === "communication",
      )!.level,
    ).toBe(4);
    expect(
      entry.editorialReference.ratings.find(
        (rating) => rating.dimension === "grammar",
      )!.level,
    ).toBeNull();
    expect(
      entry.editorialReference.ratings.find(
        (rating) => rating.dimension === "grammar",
      )!.reason,
    ).toMatch(/no aparecen/);
  });
  it("does not mutate cases, consume fetch or import active grading behavior", () => {
    const data = corpus(),
      rows = copies(),
      before = JSON.stringify({ data, rows });
    const spy = vi.spyOn(globalThis, "fetch");
    try {
      makeBlindTeacherPacket(data);
      compareDraftTeacherCalibration(data, rows);
      expect(JSON.stringify({ data, rows })).toBe(before);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});
