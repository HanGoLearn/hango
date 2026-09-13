"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import {
  ACCESSORIES,
  RARITY_PRICE,
  type AccessorySlot,
} from "@/lib/avatar-catalog";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { HanCoinsIcon } from "@/components/ui/hancoins-icon";
import { Caption } from "@/components/ui/typography";
import { cn } from "@/lib/cn";
import type { ShopMessages } from "@/i18n/messages/types";

export interface AccessoryPanelProps {
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
  messages: ShopMessages;
}

/**
 * One category's item grid (2026-08-30, "Atelier" redesign - the
 * comparison artifact the user picked). Owned and purchasable items share
 * one grid now, not separate Shop/Inventory panels - each card's action
 * (Buy / Equip / Equipped) already tells you which state it's in, a second
 * navigation layer added nothing.
 *
 * Each tile shows the *actual* accessory art (2026-08-30 correction -
 * "pon la gorra casual ahi, no un logo").
 *
 * One generic icon per accessory, not per animal (2026-08-30, user's own
 * design call - "no deberia ser mejor tener solo un icono en el shop"). The
 * grid used to show the current animal's own composited-and-isolated layer,
 * which meant 3x the art (and 3x the chance of a leftover ear/snout fragment
 * from the isolation process - exactly the bug class that took most of a
 * day to chase down for the character-compositing layers). A generic icon
 * sidesteps that failure mode entirely: it's never extracted from a
 * character render, just a standalone product shot Codex draws once per
 * item. Lives at `/avatar/icons/accessory-{key}.png`, tight-cropped with the
 * same sharp script as the old per-animal `-thumb` files. Switching animals
 * no longer changes what this grid looks like - only the live preview on
 * the portrait (AvatarDisplay) does, which still needs the full per-animal
 * compositing layer and is unaffected by this.
 *
 * The preview/thumbnail area and the Equip/Buy action are two separate
 * `<button>`s, not a button nested inside a `role="button"` card - nesting
 * interactive elements is an accessibility anti-pattern (confirmed via the
 * a11y test suite this project already keeps green everywhere else).
 */
export function AccessoryPanel({
  slot,
  ownedAccessoryKeys,
  equippedKey,
  previewKey,
  coinBalance,
  onItemClick,
  onBuy,
  isPending,
  messages,
}: AccessoryPanelProps) {
  const owned = new Set(ownedAccessoryKeys);
  const items = ACCESSORIES.filter((item) => item.slot === slot);

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
                  src={`/avatar/icons/accessory-${item.key}.png`}
                  alt={
                    messages.accessoryNames[
                      item.key as keyof typeof messages.accessoryNames
                    ] ?? item.name
                  }
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
                {messages.accessoryNames[
                  item.key as keyof typeof messages.accessoryNames
                ] ?? item.name}
              </span>
              <Chip
                tone={item.rarity === "SPECIAL" ? "accent" : "neutral"}
                size="sm"
              >
                {messages.rarity[item.rarity]}
              </Chip>
            </button>

            {isEquipped ? (
              <span className="flex items-center gap-1 font-interface text-caption font-semibold text-secondary-300">
                <Check className="size-3.5" aria-hidden="true" />
                {messages.equipped}
              </span>
            ) : isOwned ? (
              <Button
                type="button"
                size="md"
                variant="secondary"
                disabled={isPending}
                onClick={() => onItemClick(item.key)}
              >
                {messages.equip}
              </Button>
            ) : (
              <>
                {isPreviewing && (
                  <Caption className="text-accent-300">
                    {messages.previewing}
                  </Caption>
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
