import Image from "next/image";
import { cn } from "@/lib/cn";

const POSES = {
  wave: {
    src: "/mascot/han-wave.png",
    alt: "Han, the HanGo mascot, waving hello",
  },
  curious: {
    src: "/mascot/han-curious.png",
    alt: "Han, the HanGo mascot, looking curious",
  },
  heart: {
    src: "/mascot/han-heart.png",
    alt: "Han, the HanGo mascot, with a heart",
  },
  idle: { src: "/mascot/han-idle.png", alt: "Han, the HanGo mascot" },
} as const;

export type HanPose = keyof typeof POSES;

/**
 * "Han" — HanGo's mascot (DESIGN_TASKS.md, added 2026-08-07). Real
 * illustrations supplied by the user, copied into `public/mascot/`. Source
 * files are 1536×1024 with a large transparent margin around the
 * character (for the soft glow effect) — `width`/`height` below are sized
 * for that margin, not the character's actual pixel footprint, so Han
 * doesn't render tiny inside his own whitespace.
 */
export function HanMascot({
  pose = "wave",
  size = 160,
  className,
}: {
  pose?: HanPose;
  size?: number;
  className?: string;
}) {
  const { src, alt } = POSES[pose];
  return (
    <Image
      src={src}
      alt={alt}
      width={1536}
      height={1024}
      style={{ width: size, height: "auto" }}
      className={cn("select-none", className)}
      priority={false}
    />
  );
}

/**
 * Cropped, circular avatar-sized Han — for anywhere "AI Teacher" is
 * referenced (the FAB, the panel header, the streak chip): the user asked
 * for Han to stand in for the generic `Bot` icon at every one of those
 * spots, not just the full-illustration moments `HanMascot` covers.
 * `object-cover` on a square box crops tightly to the character instead of
 * showing him tiny inside his own glow margin — verified against each
 * source PNG's alpha bounding box, which sits close enough to center that
 * the default `object-position: center` needs no per-pose adjustment.
 */
export function HanAvatar({
  pose = "idle",
  size = 32,
  className,
}: {
  pose?: HanPose;
  size?: number;
  className?: string;
}) {
  const { src, alt } = POSES[pose];
  return (
    <span
      className={cn(
        "relative inline-block shrink-0 overflow-hidden rounded-full",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        style={{ objectFit: "cover", objectPosition: "center" }}
        className="select-none"
      />
    </span>
  );
}
