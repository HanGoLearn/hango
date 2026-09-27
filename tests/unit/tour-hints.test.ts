import { describe, expect, it } from "vitest";
import { TOUR_HINTS, resolveHintForPath } from "@/components/tour/tour-hints";
import { SECTION_TOUR } from "@/components/tour/tour-steps";
import { navEntries, primaryNavItems } from "@/lib/navigation";

describe("which hint belongs to a page", () => {
  it("tells the journey hub apart from a scenario inside it", () => {
    // Both live under the same prefix and say very different things.
    expect(resolveHintForPath("/learning-journey")?.id).toBe("journey");
    expect(resolveHintForPath("/learning-journey/getting-started")?.id).toBe(
      "scenario",
    );
  });

  it("stays silent on a chapter listing", () => {
    // A plain list of situations explains itself, and the scenario hint
    // would be describing a page the learner isn't on.
    expect(resolveHintForPath("/learning-journey/chapter/BEGINNER")).toBeNull();
  });

  it("covers Han's own routes as one section", () => {
    expect(resolveHintForPath("/han")?.id).toBe("han");
    expect(resolveHintForPath("/han/companion")?.id).toBe("han");
  });

  it("has nothing to say about pages outside its list", () => {
    expect(resolveHintForPath("/leaderboard")).toBeNull();
    expect(resolveHintForPath("/achievements")).toBeNull();
    expect(resolveHintForPath("/dashboard")).toBeNull();
  });

  it("matches a lesson and points at its step bar", () => {
    const hint = resolveHintForPath("/lesson/greetings");
    expect(hint?.id).toBe("lesson");
    expect(hint?.anchor).toBe("lesson-steps");
  });
});

describe("hints and the section walk share one list", () => {
  it("gives every walked section a hint with the same id", () => {
    // This is what stops a hint repeating what Han just said in person.
    const hintIds = new Set(TOUR_HINTS.map((hint) => hint.id));
    for (const step of SECTION_TOUR) {
      expect(step.hintId).toBeDefined();
      expect(hintIds).toContain(step.hintId!);
    }
  });

  it("keeps hints for the places the walk never visits", () => {
    const walked = new Set(SECTION_TOUR.map((step) => step.hintId));
    const alwaysShown = TOUR_HINTS.filter((hint) => !walked.has(hint.id));

    expect(alwaysShown.map((hint) => hint.id).sort()).toEqual([
      "lesson",
      "scenario",
      "speakingLab",
    ]);
  });

  it("uses ids that are unique", () => {
    const ids = TOUR_HINTS.map((hint) => hint.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("the section walk points at menu entries that exist", () => {
  it("every anchor it uses is a real navigation key", () => {
    // The nav renders its anchors as `nav-${key}`, so a renamed key would
    // silently leave a step spotlighting nothing. This is what catches it.
    const navKeys = new Set<string>([
      ...navEntries.map((entry) =>
        entry.kind === "group" ? entry.key : entry.item.key,
      ),
      ...primaryNavItems.map((item) => item.key),
    ]);

    const navAnchors = SECTION_TOUR.map((step) => step.anchor).filter(
      (anchor): anchor is string => anchor?.startsWith("nav-") ?? false,
    );

    expect(navAnchors.length).toBeGreaterThan(0);
    for (const anchor of navAnchors) {
      expect(navKeys).toContain(anchor.replace("nav-", ""));
    }
  });

  it("asks the learner to press, rather than moving them", () => {
    // Every step that expects a destination must point at the menu entry
    // that leads there; one without an anchor would strand the learner.
    for (const step of SECTION_TOUR) {
      if (step.route) expect(step.anchor).toBeTruthy();
    }
  });
});
