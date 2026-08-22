import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export function Display({
  className,
  ...props
}: ComponentPropsWithoutRef<"h1">) {
  return (
    <h1
      className={cn(
        "font-display text-display font-semibold text-text-primary",
        className,
      )}
      {...props}
    />
  );
}

export function PageTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"h1">) {
  return (
    <h1
      className={cn(
        "font-display text-page-title font-semibold text-text-primary",
        className,
      )}
      {...props}
    />
  );
}

export function SectionTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      className={cn(
        "font-display text-section-title font-semibold text-text-primary",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      className={cn(
        "font-interface text-card-title font-medium text-text-primary",
        className,
      )}
      {...props}
    />
  );
}

export function Body({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={cn("font-interface text-body text-text-primary", className)}
      {...props}
    />
  );
}

/** Chinese content — always the most visually prominent element (design_system.md). */
export function ChineseText({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      lang="zh"
      className={cn(
        "font-chinese text-chinese-body font-medium text-text-primary",
        className,
      )}
      {...props}
    />
  );
}

/** Pinyin — visually secondary to the Chinese text it annotates. */
export function Pinyin({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      lang="zh-Latn-pinyin"
      className={cn(
        "font-interface text-supporting text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}

/** Translation — visually secondary to the Chinese text it explains. */
export function Translation({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={cn(
        "font-interface text-supporting text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}

export function Supporting({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={cn(
        "font-interface text-supporting text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}

export function Caption({
  className,
  ...props
}: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn("font-interface text-caption text-text-muted", className)}
      {...props}
    />
  );
}
