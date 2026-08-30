import Image from "next/image";
import { animalSlug, type AccessorySlot } from "@/lib/avatar-catalog";
import { cn } from "@/lib/cn";

export interface AvatarDisplayProps {
  animal: string;
  equipped?: Partial<Record<AccessorySlot, string | null>>;
  size?: number;
  /**
   * "circle" (default) - small contexts (TopBar, leaderboard rows, Dashboard
   * teaser), matches HanAvatar's own cropped-icon treatment. "square" - the
   * tienda page's big portrait card, uncropped (the source art is already a
   * square 1024x1024 canvas per the asset contract, so this needs no
   * cropping decision, just no circular clip).
   */
  shape?: "circle" | "square";
  className?: string;
}

/**
 * Layer order matches the art contract given to Codex (2026-08-30):
 * base -> TORSO -> HEAD -> FACE, so glasses always render above a hat/hair
 * and a jacket collar always sits behind both.
 */
const LAYER_ORDER: AccessorySlot[] = ["TORSO", "HEAD", "FACE"];

/**
 * Composites the learner's avatar from pre-generated, pre-aligned PNG
 * layers (public/avatar/) - no server-side image generation per user or per
 * equip change, same "generate once, compose locally" approach as HanMascot.
 * Every layer shares the same canvas, so this only ever stacks images at
 * (0,0) - no per-animal or per-accessory positioning logic lives in code,
 * that alignment burden is entirely on the art (see the asset contract).
 */
export function AvatarDisplay({
  animal,
  equipped,
  size = 96,
  shape = "circle",
  className,
}: AvatarDisplayProps) {
  const slug = animalSlug(animal);
  const sizes = `${Math.round(size * 2)}px`;

  return (
    <span
      className={cn(
        "relative inline-block shrink-0 overflow-hidden",
        shape === "circle" ? "rounded-full" : "rounded-panel",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={`/avatar/avatar-${slug}-base.png`}
        alt=""
        fill
        sizes={sizes}
        style={{ objectFit: "cover" }}
      />
      {equipped &&
        LAYER_ORDER.map((slot) => {
          const accessoryKey = equipped[slot];
          if (!accessoryKey) return null;
          return (
            <Image
              key={slot}
              src={`/avatar/avatar-${slug}-${slot.toLowerCase()}-${accessoryKey}.png`}
              alt=""
              fill
              sizes={sizes}
              style={{ objectFit: "cover" }}
            />
          );
        })}
    </span>
  );
}
