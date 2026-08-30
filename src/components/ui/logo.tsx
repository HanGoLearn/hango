import { cn } from "@/lib/cn";

/**
 * The HanGo mark (DESIGN_TASKS.md — supplied as a reference image, no
 * source file existed, so this SVG recreates it: a bold geometric "H" with
 * its top-left and bottom-right corners diagonally clipped for a folded,
 * dynamic feel). Uses `currentColor`, so the caller sets the color via a
 * text-color utility — there's no baked-in porcelain badge here; on the
 * dark navigation shell this renders directly in a light tone instead.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("size-8", className)}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M30,14 L38,14 L38,42 L62,42 L62,14 L82,14 L82,74 L70,86 L62,86 L62,58 L38,58 L38,86 L18,86 L18,26 Z" />
    </svg>
  );
}

/**
 * Icon + wordmark, for the primary nav. Wordmark uses the display face
 * (Fraunces). Monochrome by default, like the reference (dark ink on
 * porcelain) — the mark isn't red in the source image, only the
 * "PREMIUM / EDITORIAL" label text was.
 *
 * `size` (2026-08-29): "lg" doubles both the mark and the wordmark, for the
 * auth panel's hero placement - "md" (default) is byte-identical to the
 * original single-size markup, so every other call site is unaffected.
 */
export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        size === "lg" ? "gap-3" : "gap-2",
        className,
      )}
    >
      <LogoMark
        className={cn(size === "lg" ? "size-14" : "size-7", "text-text-primary")}
      />
      <span
        className={cn(
          "font-display font-semibold text-text-primary",
          size === "lg" ? "text-[2.25rem]" : "text-card-title",
        )}
      >
        HanGo
      </span>
    </span>
  );
}
