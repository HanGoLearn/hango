import { describe, expect, it } from "vitest";
import {
  ACCESSORIES,
  ACCESSORIES_BY_KEY,
  ANIMALS,
  ANIMALS_BY_KEY,
  RARITY_PRICE,
  animalSlug,
} from "@/lib/avatar-catalog";

describe("avatar catalog", () => {
  it("has no duplicate accessory keys", () => {
    const keys = ACCESSORIES.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has no duplicate animal keys", () => {
    const keys = ANIMALS.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has exactly 4 accessories per slot (2 common + 2 special)", () => {
    for (const slot of ["HEAD", "FACE", "TORSO"] as const) {
      const inSlot = ACCESSORIES.filter((a) => a.slot === slot);
      expect(inSlot).toHaveLength(4);
      expect(inSlot.map((a) => a.rarity).sort()).toEqual([
        "COMMON",
        "COMMON",
        "SPECIAL",
        "SPECIAL",
      ]);
    }
  });

  it("has exactly 3 available animals (the launch trio) and 9 locked", () => {
    expect(ANIMALS.filter((a) => a.available)).toHaveLength(3);
    expect(ANIMALS.filter((a) => !a.available)).toHaveLength(9);
  });

  it("RARITY_PRICE defines all 3 tiers, strictly increasing", () => {
    expect(RARITY_PRICE.COMMON).toBeGreaterThan(0);
    expect(RARITY_PRICE.SPECIAL).toBeGreaterThan(RARITY_PRICE.COMMON);
    expect(RARITY_PRICE.LIMITED).toBeGreaterThan(RARITY_PRICE.SPECIAL);
  });

  it("every accessory's price resolves via RARITY_PRICE", () => {
    for (const accessory of ACCESSORIES) {
      expect(RARITY_PRICE[accessory.rarity]).toBeGreaterThan(0);
    }
  });

  it("ACCESSORIES_BY_KEY / ANIMALS_BY_KEY match the source arrays", () => {
    for (const accessory of ACCESSORIES) {
      expect(ACCESSORIES_BY_KEY.get(accessory.key)).toEqual(accessory);
    }
    for (const animal of ANIMALS) {
      expect(ANIMALS_BY_KEY.get(animal.key)).toEqual(animal);
    }
  });

  it("animalSlug lowercases the animal key for the art file naming convention", () => {
    expect(animalSlug("RABBIT")).toBe("rabbit");
    expect(animalSlug("MONKEY")).toBe("monkey");
    expect(animalSlug("DOG")).toBe("dog");
  });
});
