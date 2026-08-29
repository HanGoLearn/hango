"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function FlipFactCard({
  tag,
  front,
  backTitle,
  backBody,
}: {
  tag: string;
  front: string;
  backTitle: string;
  backBody: string;
}) {
  const [flipped, setFlipped] = useState(false);

  function toggle() {
    setFlipped((v) => !v);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${front} — tap to reveal more`}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
      className="h-48 cursor-pointer [perspective:1000px]"
    >
      <div
        className={cn(
          "relative h-full w-full transition-transform duration-500 ease-out [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]",
        )}
      >
        <div className="absolute inset-0 flex flex-col justify-between rounded-card border border-border bg-elevated p-5 [backface-visibility:hidden]">
          <div>
            <p className="text-caption font-semibold tracking-wide text-text-muted uppercase">
              {tag}
            </p>
            <h3 className="mt-2 font-interface text-card-title font-semibold text-text-primary">
              {front}
            </h3>
          </div>
          <p className="text-caption text-secondary-400">Tap to reveal →</p>
        </div>
        <div className="absolute inset-0 flex flex-col justify-center gap-2 rounded-card border border-transparent bg-primary-500 p-5 text-on-color-light [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <h4 className="font-interface text-body font-semibold">
            {backTitle}
          </h4>
          <p className="text-supporting opacity-90">{backBody}</p>
        </div>
      </div>
    </div>
  );
}
