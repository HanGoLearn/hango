"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import {
  ACCESSORIES,
  RARITY_PRICE,
  animalSlug,
  type AccessorySlot,
} from "@/lib/avatar-catalog";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { HanCoinsIcon } from "@/components/ui/hancoins-icon";
import { Caption } from "@/components/ui/typography";
import { cn } from "@/lib/cn";

export interface AccessoryPanelProps {
  /** Which animal's version of each accessory to render - every accessory file is drawn per-animal. */
  animal: string;
  slot: AccessorySlot;
  ownedAccessoryKeys: string[];
  /** Real equipped key for this slot (null = nothing equipped). */
  equippedKey: string | null;
  /** Locally-previewed unowned key for this slot, if the learner is trying one on before buying. */
  previewKey: string | null;
  coinBalance: number;
  /** Owned item: equip/unequip toggle. Unowned item: toggle the local preview. Parent decides which, based on ownership. */
  onItemClick: (accessoryKey: string) => void;
  onBuy: (accessoryKey: string) => void;
  isPending: boolean;
}

/**
 * One category's item grid (2026-08-30, "Atelier" redesign - the
 * comparison artifact the user picked). Owned and purchasable items share
 * one grid now, not separate Shop/Inventory panels - each card's action
 * (Buy / Equip / Equipped) already tells you which state it's in, a second
 * navigation layer added nothing.
 *
 * Each tile shows the *actual* accessory art (2026-08-30 correction -
 * "pon la gorra casual ahi, no un logo"). Every accessory file is already
 * its own transparent layer meant to be composited over the base animal,
 * so rendering it alone (no base underneath) is exactly "just the
 * product," for free - no new art contract needed.
 *
 * Uses a `-thumb` variant of each file, not the full compositing layer
 * (2026-08-30, "que los iconos se vean mas grandes") - the real accessory
 * only occupies 7-30% of the shared 1024x1024 canvas (the rest is margin
 * needed to align on the character), so at tile size the item read as tiny
 * inside a mostly-empty box. The `-thumb` files are a one-time tight crop
 * around each item's real content (generated with sharp, not part of the
 * asset contract given to Codex) - only for this grid, never used by
 * AvatarDisplay, which still needs the full untrimmed canvas to stay
 * aligned with the other layers.
 *
 * The preview/thumbnail area and the Equip/Buy action are two separate
 * `<button>`s, not a button nested inside a `role="button"` card - nesting
 * interactive elements is an accessibility anti-pattern (confirmed via the
 * a11y test suite this project already keeps green everywhere else).
 */
export function AccessoryPanel({
  animal,
  slot,
  ownedAccessoryKeys,
  equippedKey,
  previewKey,
  coinBalance,
  onItemClick,
  onBuy,
  isPending,
}: AccessoryPanelProps) {
  const owned = new Set(ownedAccessoryKeys);
  const items = ACCESSORIES.filter((item) => item.slot === slot);
  const slug = animalSlug(animal);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => {
        const isOwned = owned.has(item.key);
        const isEquipped = equippedKey === item.key;
        const isPreviewing = !isOwned && previewKey === item.key;
        const price = RARITY_PRICE[item.rarity];
        const canAfford = coinBalance >= price;
        const highlighted = isEquipped || isPreviewing;

        return (
          <div
            key={item.key}
            className={cn(
              "flex flex-col items-center gap-2 rounded-panel border px-3 py-4 text-center transition-colors duration-fast ease-standard",
              highlighted
                ? "border-accent-500 bg-accent-500/10"
                : "border-border bg-surface",
            )}
          >
            <button
              type="button"
              onClick={() => onItemClick(item.key)}
              className="flex flex-col items-center gap-2 rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              aria-pressed={highlighted}
            >
              <span className="relative flex size-28 shrink-0 items-center justify-center">
                <Image
                  src={`/avatar/thumbs/avatar-${slug}-${slot.toLowerCase()}-${item.key}-thumb.png`}
                  alt={item.name}
                  fill
                  sizes="112px"
                  style={{ objectFit: "contain" }}
                />
                {isOwned && (
                  <span className="absolute top-0 right-0 flex size-5 items-center justify-center rounded-full bg-secondary-500 text-on-color-light">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                )}
              </span>
              <span className="font-interface text-supporting font-semibold text-text-primary">
                {item.name}
              </span>
              <Chip tone={item.rarity === "SPECIAL" ? "accent" : "neutral"} size="sm">
                {item.rarity === "SPECIAL" ? "Special" : "Common"}
              </Chip>
            </button>

            {isEquipped ? (
              <span className="flex items-center gap-1 font-interface text-caption font-semibold text-secondary-300">
                <Check className="size-3.5" aria-hidden="true" />
                Equipped
              </span>
            ) : isOwned ? (
              <Button
                type="button"
                size="md"
                variant="secondary"
                disabled={isPending}
                onClick={() => onItemClick(item.key)}
              >
                Equip
              </Button>
            ) : (
              <>
                {isPreviewing && (
                  <Caption className="text-accent-300">Previewing</Caption>
                )}
                <Button
                  type="button"
                  size="md"
                  disabled={isPending || !canAfford}
                  onClick={() => onBuy(item.key)}
                >
                  <HanCoinsIcon size={16} />
                  {price}
                </Button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
