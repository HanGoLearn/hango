import { beforeEach, describe, expect, it, vi } from "vitest";

const { getStations, getScene } = vi.hoisted(() => ({
  getStations: vi.fn(),
  getScene: vi.fn(),
}));
vi.mock("@/lib/beta-speaking-stations", () => ({
  getBetaSpeakingStations: getStations,
  getBetaSpeakingStationConversation: getScene,
}));
vi.mock("@/i18n/get-dictionary", () => ({
  getDictionary: async () => ({ speakingLab: {} }),
}));
vi.mock("@/components/speaking/beta-speaking-stations", () => ({
  BetaSpeakingStations: () => null,
}));

import SpeakingLabPage from "../../app/[locale]/(app)/speaking-lab/page";
import { BetaSpeakingStations } from "@/components/speaking/beta-speaking-stations";

const stations = ["INTRODUCTIONS", "NUMBERS_TIME", "PRICES"].map((id) => ({
  id,
  lessonId: `lesson-${id}`,
  lessonSlug: `lesson-${id}`,
}));
beforeEach(() => {
  vi.clearAllMocks();
  getStations.mockResolvedValue(stations);
  getScene.mockResolvedValue({
    rolePlay: { aiRole: "classmate" },
    helpPhrases: [],
  });
});

describe("Speaking Lab navigation", () => {
  it("returns from a character scene to the same three-station screen", async () => {
    const scene = await SpeakingLabPage({
      params: Promise.resolve({ locale: "es" }),
      searchParams: Promise.resolve({ station: "INTRODUCTIONS" }),
    });
    expect(scene?.type).toBe(BetaSpeakingStations);
    expect(scene?.props.selectedStation).toBe(stations[0]);
    const home = await SpeakingLabPage({
      params: Promise.resolve({ locale: "es" }),
      searchParams: Promise.resolve({}),
    });
    expect(home?.type).toBe(BetaSpeakingStations);
    expect(home?.props.stations).toHaveLength(3);
    expect(home?.props.selectedStation).toBeNull();
  });

  it("keeps old lesson links and unknown station links on the new screen", async () => {
    for (const search of [{ lessonId: "old-lesson" }, { station: "RETIRED" }]) {
      const page = await SpeakingLabPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve(search),
      });
      expect(page?.type).toBe(BetaSpeakingStations);
      expect(page?.props.selectedStation).toBeNull();
      expect(page?.props.stations).toHaveLength(3);
    }
    expect(getScene).not.toHaveBeenCalled();
  });
});
