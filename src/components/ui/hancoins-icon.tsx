import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * The real HanCoins mark (2026-08-30, user-supplied art, replaces the
 * lucide `Coins` placeholder) - an open book with an "H" cut into the
 * spine, deliberately distinct from Han's own face (already used
 * everywhere as "your teacher is here") so the currency reads as its own
 * thing, not a second Han avatar. Static asset, same convention as every
 * other piece of art in this app (public/mascot/, public/avatar/) - never
 * stored in the database.
 */
export function HanCoinsIcon({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/hancoins-icon.png"
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
    />
  );
}
