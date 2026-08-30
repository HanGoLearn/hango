/**
 * Avatar + HanCoins catalog (2026-08-30, user request) - fixed, code-defined
 * lists, same convention as achievements-catalog.ts: content lives in code,
 * not the database. Adding a 4th animal or a new accessory later is a
 * catalog edit, never a migration.
 */

export type AccessorySlot = "HEAD" | "FACE" | "TORSO";
export type AccessoryRarity = "COMMON" | "SPECIAL" | "LIMITED";

/**
 * Prices (2026-08-30, user's explicit choice - deliberately slower than the
 * first "reachable in one session" draft): Common lands around 2-2.5 weeks
 * of steady lesson/scenario coins for an active learner, Special around
 * 6-7 weeks. LIMITED is reserved for a future rarity tier - no catalog
 * entries use it yet, kept here so adding one later needs no schema change.
 */
export const RARITY_PRICE: Record<AccessoryRarity, number> = {
  COMMON: 50,
  SPECIAL: 150,
  LIMITED: 275,
};

export interface AccessoryDefinition {
  key: string;
  slot: AccessorySlot;
  rarity: AccessoryRarity;
  name: string;
}

/**
 * 12 accessories (4 per slot). No "free" entries here - the bare animal (no
 * accessory equipped) is the free/default look for every slot, so it
 * doesn't need its own catalog row or art file.
 *
 * The second COMMON/SPECIAL pair per slot (2026-08-30, user's second Codex
 * batch) reuses the exact same rarity/price tiers as the first 6 rather
 * than introducing a new one - "more options at the same two price points,"
 * not a new economy tier.
 */
export const ACCESSORIES: AccessoryDefinition[] = [
  { key: "cap", slot: "HEAD", rarity: "COMMON", name: "Casual Cap" },
  { key: "bamboo-hat", slot: "HEAD", rarity: "SPECIAL", name: "Bamboo Hat" },
  { key: "red-beanie", slot: "HEAD", rarity: "COMMON", name: "HanGo Red Beanie" },
  { key: "traditional-hairstyle", slot: "HEAD", rarity: "SPECIAL", name: "Traditional Hairstyle" },
  { key: "round-glasses", slot: "FACE", rarity: "COMMON", name: "Round Glasses" },
  { key: "gold-sunglasses", slot: "FACE", rarity: "SPECIAL", name: "Gold Sunglasses" },
  { key: "square-glasses", slot: "FACE", rarity: "COMMON", name: "Square Glasses" },
  { key: "festival-red-glasses", slot: "FACE", rarity: "SPECIAL", name: "Festival Red Glasses" },
  { key: "polo", slot: "TORSO", rarity: "COMMON", name: "HanGo Polo" },
  { key: "tang-jacket", slot: "TORSO", rarity: "SPECIAL", name: "Tang Jacket" },
  { key: "varsity-jacket", slot: "TORSO", rarity: "COMMON", name: "HanGo Varsity Jacket" },
  { key: "modern-hanfu", slot: "TORSO", rarity: "SPECIAL", name: "Modern Hanfu" },
];

export const ACCESSORIES_BY_KEY: Map<string, AccessoryDefinition> = new Map(
  ACCESSORIES.map((accessory) => [accessory.key, accessory]),
);

export interface AnimalDefinition {
  key: string;
  name: string;
  /** false = shown as a gray silhouette + name + "Coming soon", not selectable yet. */
  available: boolean;
}

/**
 * The 12 zodiac signs, plain versions only (no "jade rabbit"/"golden
 * monkey" styling - user's explicit correction). Only the first 3 are
 * available at launch; the other 9 exist here so the "coming soon" list is
 * real data, not a placeholder, and so unlocking one later is a single
 * `available: true` flip.
 */
export const ANIMALS: AnimalDefinition[] = [
  { key: "RABBIT", name: "Rabbit", available: true },
  { key: "MONKEY", name: "Monkey", available: true },
  { key: "DOG", name: "Dog", available: true },
  { key: "RAT", name: "Rat", available: false },
  { key: "OX", name: "Ox", available: false },
  { key: "TIGER", name: "Tiger", available: false },
  { key: "DRAGON", name: "Dragon", available: false },
  { key: "SNAKE", name: "Snake", available: false },
  { key: "HORSE", name: "Horse", available: false },
  { key: "GOAT", name: "Goat", available: false },
  { key: "ROOSTER", name: "Rooster", available: false },
  { key: "PIG", name: "Pig", available: false },
];

export const ANIMALS_BY_KEY: Map<string, AnimalDefinition> = new Map(
  ANIMALS.map((animal) => [animal.key, animal]),
);

/** Lowercase slug used in the art file naming convention (avatar-{slug}-base.png). */
export function animalSlug(animalKey: string): string {
  return animalKey.toLowerCase();
}
