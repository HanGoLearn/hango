"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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
  thinking: {
    src: "/mascot/han-thinking.png",
    alt: "Han, the HanGo mascot, thinking",
  },
  wrong: {
    src: "/mascot/han-wrong.png",
    alt: "Han, the HanGo mascot, apologetic",
  },
  celebrating: {
    src: "/mascot/han-celebrating.png",
    alt: "Han, the HanGo mascot, celebrating",
  },
} as const;

export type HanPose = keyof typeof POSES;

/** Every source PNG shares this canvas (1536x1024) - used to give HanMascot's box an explicit height matching the art's real aspect ratio (see StaticMascotFrame's `fill` note below), instead of leaving it to the browser to infer. */
const MASCOT_ASPECT_RATIO = 1024 / 1536;

/** A gentle looping float + tilt - real dynamism on the existing static art, no rigged/animated asset needed (2026-08-27, "no debe quedarse estático"). Kept subtle per the redesign brief's own "animaciones sutiles" principle - a drift, not a bounce. */
const IDLE_FLOAT = {
  y: [0, -8, 0],
  rotate: [0, -1.5, 0, 1.5, 0],
};
const IDLE_TRANSITION = {
  duration: 3.2,
  repeat: Infinity,
  ease: "easeInOut" as const,
};

/**
 * Real hand-wave (2026-08-29): 4 hand-drawn frames of the `wave` pose,
 * body and face fixed, only the arm changing position - replaces the
 * earlier whole-body side-to-side sway approximation (2026-08-28, which
 * read as "jumping" per feedback) now that dedicated art exists. Only
 * defined for the `wave` pose; `gesture="wave"` on any other pose is a
 * no-op (no frames exist for it).
 */
const WAVE_FRAMES = [
  "/mascot/han-wave-1.png",
  "/mascot/han-wave-2.png",
  "/mascot/han-wave-3.png",
  "/mascot/han-wave-4.png",
];
const WAVE_FRAME_MS = 220;

function useWaveFrame(active: boolean): string | undefined {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % WAVE_FRAMES.length);
    }, WAVE_FRAME_MS);
    return () => clearInterval(id);
  }, [active]);
  return active ? WAVE_FRAMES[index] : undefined;
}

/**
 * Milestone 7 (2026-08-29) - the actual pixel-rendering implementation
 * behind `HanMascot`/`HanAvatar`'s pose-based public API. Today this is
 * always a static PNG via `next/image` in `fill` mode (the parent element
 * supplies real, explicit dimensions - see `MASCOT_ASPECT_RATIO` and
 * `HanAvatar`'s own `size`x`size` box - so `fill` + `object-fit: cover`
 * is correct for both the full illustration and the cropped avatar, not
 * just the avatar).
 *
 * This is the seam a future `@rive-app/react-canvas` renderer would plug
 * into once real `.riv` assets exist: same `{ src, alt, sizes }` contract,
 * swapped in behind `HanMascot`/`HanAvatar` without either component's own
 * props changing. No Rive dependency or asset added yet - this only
 * documents where it would go.
 */
function StaticMascotFrame({
  src,
  alt,
  sizes,
}: {
  src: string;
  alt: string;
  sizes: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      style={{ objectFit: "cover", objectPosition: "center" }}
      className="select-none"
    />
  );
}

/**
 * Cross-fades between *poses* (2026-08-29, Milestone 7's one real
 * animation improvement - pose swaps were an instant cut before). Keyed
 * on `pose`, not on `src`: the wave-frame cycling above changes `src`
 * every 220ms within the *same* pose and must stay an instant, crisp cut
 * (cross-fading a hand-wave's frames would just look blurry) - only a
 * genuine pose change (idle -> celebrating, etc.) re-keys this and
 * triggers the fade.
 */
function MascotCrossfade({
  pose,
  src,
  alt,
  sizes,
  reduceMotion,
}: {
  pose: HanPose;
  src: string;
  alt: string;
  sizes: string;
  reduceMotion: boolean | null;
}) {
  return (
    <AnimatePresence initial={false}>
      <motion.span
        key={pose}
        className="absolute inset-0"
        initial={reduceMotion ? undefined : { opacity: 0 }}
        animate={reduceMotion ? undefined : { opacity: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        <StaticMascotFrame src={src} alt={alt} sizes={sizes} />
      </motion.span>
    </AnimatePresence>
  );
}

/**
 * "Han" — HanGo's mascot (DESIGN_TASKS.md, added 2026-08-07). Real
 * illustrations supplied by the user, copied into `public/mascot/`. Source
 * files are 1536×1024 with a large transparent margin around the
 * character (for the soft glow effect) — `width`/`height` below are sized
 * for that margin, not the character's actual pixel footprint, so Han
 * doesn't render tiny inside his own whitespace.
 *
 * `animate` (2026-08-27): an idle float/tilt loop via `motion`, on by
 * default here since this is the "hero" illustration context (Dashboard,
 * onboarding, lesson intros) where a static mascot reads as lifeless.
 * Respects `prefers-reduced-motion` via `useReducedMotion()` — `motion`
 * animations are JS-driven, so the project's existing global CSS
 * reduced-motion rule (globals.css) doesn't reach them on its own.
 */
export function HanMascot({
  pose = "wave",
  size = 160,
  animate = true,
  gesture = "idle",
  className,
}: {
  pose?: HanPose;
  size?: number;
  animate?: boolean;
  gesture?: "idle" | "wave";
  className?: string;
}) {
  const { src: poseSrc, alt } = POSES[pose];
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animate && !reduceMotion;
  const waving = gesture === "wave" && pose === "wave" && shouldAnimate;
  const waveFrameSrc = useWaveFrame(waving);
  const idling = gesture === "idle" && shouldAnimate;

  return (
    <motion.span
      className={cn("relative inline-block select-none", className)}
      style={{ width: size, height: size * MASCOT_ASPECT_RATIO }}
      animate={idling ? IDLE_FLOAT : undefined}
      transition={idling ? IDLE_TRANSITION : undefined}
    >
      <MascotCrossfade
        pose={pose}
        src={waveFrameSrc ?? poseSrc}
        alt={alt}
        sizes={`${Math.round(size * 2)}px`}
        reduceMotion={reduceMotion}
      />
    </motion.span>
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
 *
 * `animate` defaults to `false` here (unlike `HanMascot`) — at avatar size,
 * in nav/chrome contexts a learner sees on every page, constant motion
 * would be distracting rather than delightful. Callers that want it (e.g.
 * a "Han is thinking" moment) can opt in explicitly.
 */
export function HanAvatar({
  pose = "idle",
  size = 32,
  animate = false,
  gesture = "idle",
  className,
}: {
  pose?: HanPose;
  size?: number;
  animate?: boolean;
  gesture?: "idle" | "wave";
  className?: string;
}) {
  const { src: poseSrc, alt } = POSES[pose];
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animate && !reduceMotion;
  const waving = gesture === "wave" && pose === "wave" && shouldAnimate;
  const waveFrameSrc = useWaveFrame(waving);
  const idling = gesture === "idle" && shouldAnimate;

  return (
    <motion.span
      className={cn(
        "relative inline-block shrink-0 overflow-hidden rounded-full",
        className,
      )}
      style={{ width: size, height: size }}
      animate={idling ? IDLE_FLOAT : undefined}
      transition={idling ? IDLE_TRANSITION : undefined}
    >
      <MascotCrossfade
        pose={pose}
        src={waveFrameSrc ?? poseSrc}
        alt={alt}
        sizes={`${Math.round(size * 2)}px`}
        reduceMotion={reduceMotion}
      />
    </motion.span>
  );
}
