"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PawPrint, Crown, Glasses, Shirt, type LucideIcon } from "lucide-react";
import { ACCESSORIES_BY_KEY, type AccessorySlot } from "@/lib/avatar-catalog";
import {
  saveAvatarAnimalAction,
  purchaseAccessoryAction,
  equipAccessoryAction,
} from "@/lib/actions/avatar";
import { AvatarDisplay } from "@/components/avatar/avatar-display";
import { AnimalGrid } from "@/components/avatar/animal-grid";
import { AccessoryPanel } from "@/components/avatar/accessory-panel";
import { InformationBanner } from "@/components/ui/banner";
import { HanCoinsIcon } from "@/components/ui/hancoins-icon";
import { HanCoinsInfoTrigger } from "@/components/avatar/hancoins-info";
import { CardTitle, Caption } from "@/components/ui/typography";
import { cn } from "@/lib/cn";

type Tab = "ANIMAL" | AccessorySlot;

const TAB_ORDER: Tab[] = ["ANIMAL", "HEAD", "FACE", "TORSO"];
const TAB_LABELS: Record<Tab, string> = {
  ANIMAL: "Animal",
  HEAD: "Head",
  FACE: "Face",
  TORSO: "Torso",
};
const TAB_ICONS: Record<Tab, LucideIcon> = {
  ANIMAL: PawPrint,
  HEAD: Crown,
  FACE: Glasses,
  TORSO: Shirt,
};
const SLOT_ORDER: AccessorySlot[] = ["HEAD", "FACE", "TORSO"];

export interface TiendaWorkshopProps {
  animal: string | null;
  animalName: string | null;
  equipped: Record<AccessorySlot, string | null>;
  ownedAccessoryKeys: string[];
  coinBalance: number;
}

/**
 * "Atelier" (2026-08-30) - the direction the user picked from a 3-way
 * comparison artifact (published this session). Editorial, character-first:
 * a big portrait card with an "outfit credit" line (equipped items listed
 * like a fashion caption), tabs for Animal/Head/Face/Torso replacing the
 * earlier Change Animal / Shop / Inventory / Accept button row.
 *
 * Equip/unequip on an *owned* item is instant and real
 * (equipAccessoryAction right away) - it's free and reversible, no reason
 * to gate it behind a separate confirm step. An *unowned* item only ever
 * locally previews on the character (no server call) until Buy is pressed,
 * which purchases AND equips it in one action - this answers the original
 * "quiero ver cómo me queda antes de comprarlo" request more directly than
 * the earlier global-preview-plus-Accept-button design it replaces.
 */
export function TiendaWorkshop({
  animal,
  animalName,
  equipped,
  ownedAccessoryKeys,
  coinBalance,
}: TiendaWorkshopProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("HEAD");
  const [preview, setPreview] = useState<{ slot: AccessorySlot; key: string } | null>(
    null,
  );
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const owned = new Set(ownedAccessoryKeys);

  const displayEquipped: Record<AccessorySlot, string | null> = {
    ...equipped,
    ...(preview ? { [preview.slot]: preview.key } : {}),
  };

  const outfitNames = SLOT_ORDER.map((slot) => displayEquipped[slot])
    .filter((key): key is string => key !== null)
    .map((key) => ACCESSORIES_BY_KEY.get(key)?.name)
    .filter((name): name is string => Boolean(name));

  const handleAnimalSelect = (animalKey: string) => {
    if (animalKey === animal || isPending) return;
    setError(undefined);
    startTransition(async () => {
      const result = await saveAvatarAnimalAction(animalKey);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  };

  const handleItemClick = (slot: AccessorySlot, accessoryKey: string) => {
    setError(undefined);
    if (owned.has(accessoryKey)) {
      setPreview(null);
      startTransition(async () => {
        const isEquipped = equipped[slot] === accessoryKey;
        const result = await equipAccessoryAction(
          slot,
          isEquipped ? null : accessoryKey,
        );
        if (result.status === "error") {
          setError(result.message);
          return;
        }
        router.refresh();
      });
    } else {
      setPreview((current) =>
        current?.slot === slot && current.key === accessoryKey
          ? null
          : { slot, key: accessoryKey },
      );
    }
  };

  const handleBuy = (slot: AccessorySlot, accessoryKey: string) => {
    setError(undefined);
    startTransition(async () => {
      const purchase = await purchaseAccessoryAction(accessoryKey);
      if (purchase.status === "error") {
        setError(purchase.message);
        return;
      }
      const equip = await equipAccessoryAction(slot, accessoryKey);
      if (equip.status === "error") {
        setError(equip.message);
        return;
      }
      setPreview(null);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="flex flex-col items-center gap-3 rounded-panel border border-border bg-elevated p-6 sm:w-72 sm:shrink-0">
        {animal ? (
          <AvatarDisplay
            animal={animal}
            equipped={displayEquipped}
            shape="square"
            size={224}
          />
        ) : (
          <span className="flex size-56 items-center justify-center rounded-panel bg-surface text-text-muted">
            ?
          </span>
        )}
        <CardTitle>{animalName ?? "No avatar yet"}</CardTitle>
        <Caption className="text-center text-text-muted italic">
          {outfitNames.length > 0
            ? `Wearing: ${outfitNames.join(", ")}`
            : "Nothing equipped yet"}
        </Caption>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {TAB_ORDER.map((t) => {
              const Icon = TAB_ICONS[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-control border px-3 py-2 font-interface text-supporting font-semibold transition-colors duration-fast ease-standard",
                    tab === t
                      ? "border-text-primary bg-text-primary text-page"
                      : "border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {TAB_LABELS[t]}
                </button>
              );
            })}
          </div>
          <HanCoinsInfoTrigger balance={coinBalance} className="shrink-0">
            <span className="flex items-center gap-1.5 rounded-full bg-accent-500 px-3 py-1.5 font-interface text-supporting font-bold text-on-color-dark">
              <HanCoinsIcon size={16} />
              {coinBalance}
            </span>
          </HanCoinsInfoTrigger>
        </div>

        {error && <InformationBanner variant="error">{error}</InformationBanner>}

        {tab === "ANIMAL" && (
          <AnimalGrid selected={animal} onSelect={handleAnimalSelect} />
        )}
        {tab !== "ANIMAL" && animal && (
          <AccessoryPanel
            animal={animal}
            slot={tab}
            ownedAccessoryKeys={ownedAccessoryKeys}
            equippedKey={equipped[tab]}
            previewKey={preview?.slot === tab ? preview.key : null}
            coinBalance={coinBalance}
            onItemClick={(key) => handleItemClick(tab, key)}
            onBuy={(key) => handleBuy(tab, key)}
            isPending={isPending}
          />
        )}
      </div>
    </div>
  );
}
