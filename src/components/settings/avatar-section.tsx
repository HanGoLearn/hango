import Link from "next/link";
import { AvatarDisplay } from "@/components/avatar/avatar-display";
import { Chip } from "@/components/ui/chip";
import { HanCoinsIcon } from "@/components/ui/hancoins-icon";
import type { AccessorySlot } from "@/lib/avatar-catalog";
import type { AppLocale } from "@/i18n/config";
import { localePath } from "@/i18n/config";
import type { SettingsMessages } from "@/i18n/messages/types";

export interface AvatarSectionProps {
  animal: string | null;
  animalName: string | null;
  equipped: Record<AccessorySlot, string | null>;
  coinBalance: number;
  locale: AppLocale;
  messages: SettingsMessages["avatar"];
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
  locale,
  messages,
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
            {animalName ?? messages.none}
          </span>
          <Chip tone="accent" size="sm" className="w-fit">
            <HanCoinsIcon size={14} />
            {coinBalance}
          </Chip>
        </div>
      </div>
      <Link
        href={localePath(locale, "/tienda")}
        className="shrink-0 text-supporting font-medium text-primary-300 underline-offset-4 hover:underline"
      >
        {messages.manage}
      </Link>
    </div>
  );
}
