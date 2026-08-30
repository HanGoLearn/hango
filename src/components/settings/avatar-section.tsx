import Link from "next/link";
import { AvatarDisplay } from "@/components/avatar/avatar-display";
import { Chip } from "@/components/ui/chip";
import { HanCoinsIcon } from "@/components/ui/hancoins-icon";
import type { AccessorySlot } from "@/lib/avatar-catalog";

export interface AvatarSectionProps {
  animal: string | null;
  animalName: string | null;
  equipped: Record<AccessorySlot, string | null>;
  coinBalance: number;
}

/**
 * Settings entry point for the avatar (2026-08-30, user request - "en
 * setting tampoco [aparece mi personaje]"). A summary + link, not a
 * duplicate of the picker/shop - `/tienda` already owns that, same
 * "summary card links to the real page" pattern as the Dashboard teasers.
 */
export function AvatarSection({
  animal,
  animalName,
  equipped,
  coinBalance,
}: AvatarSectionProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {animal ? (
          <AvatarDisplay animal={animal} equipped={equipped} size={56} />
        ) : (
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-elevated text-text-muted"
            aria-hidden="true"
          >
            ?
          </span>
        )}
        <div className="flex flex-col gap-1">
          <span className="font-interface text-body font-medium text-text-primary">
            {animalName ?? "No avatar chosen yet"}
          </span>
          <Chip tone="accent" size="sm" className="w-fit">
            <HanCoinsIcon size={14} />
            {coinBalance}
          </Chip>
        </div>
      </div>
      <Link
        href="/tienda"
        className="shrink-0 text-supporting font-medium text-primary-300 underline-offset-4 hover:underline"
      >
        Manage →
      </Link>
    </div>
  );
}
