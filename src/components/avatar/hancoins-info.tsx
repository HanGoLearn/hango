"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  CalendarCheck,
  BookOpen,
  CheckCircle,
  Award,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";
import { HanCoinsIcon } from "@/components/ui/hancoins-icon";
import { Chip } from "@/components/ui/chip";
import { Body, Caption } from "@/components/ui/typography";
import { cn } from "@/lib/cn";
import type { ShellMessages } from "@/i18n/messages/types";
import { formatMessage } from "@/i18n/format";

interface CoinSource {
  icon: LucideIcon;
  key: keyof ShellMessages["hanCoins"]["sources"];
  amount: string;
}

const SOURCES: CoinSource[] = [
  {
    icon: CalendarCheck,
    key: "daily",
    amount: "5",
  },
  {
    icon: BookOpen,
    key: "lesson",
    amount: "1–3",
  },
  {
    icon: CheckCircle,
    key: "scenario",
    amount: "5",
  },
  {
    icon: Award,
    key: "achievement",
    amount: "10–250",
  },
  {
    icon: Trophy,
    key: "leaderboard",
    amount: "50 / 30 / 10",
  },
];

export interface HanCoinsInfoTriggerProps {
  balance: number;
  /** Rendered as the clickable trigger (a Chip, a pill, etc.) - this component just makes it open the explainer. */
  children: React.ReactNode;
  className?: string;
  messages: ShellMessages["hanCoins"];
}

/**
 * "Anuncio" explaining HanCoins (2026-08-30, user request), opened by
 * tapping the balance wherever it's shown. Reuses the shared Modal (Radix)
 * rather than a bespoke dialog, so it inherits the same overlay/focus-trap/
 * Escape behavior every other modal in the app already has.
 *
 * Full title+detail rows, same content as the first draft (2026-08-30
 * follow-up - "me gustaba la informacion que estaba antes... quiero que
 * este la misma informacion"). The earlier "too tall, needed 90% zoom"
 * problem is fixed by going wider (max-w-lg) and shrinking the header to a
 * compact horizontal row (icon + title + balance, not stacked), not by
 * cutting body content. `max-h-[85dvh]` + internal scroll stays as a safety
 * net regardless of viewport height.
 *
 * The gradient header stays on the darker end of the accent ramp (700->500,
 * not up to the lighter 300) specifically so Modal's own built-in close X
 * (text-text-secondary, not overridden here) stays legible against it
 * without needing to fork that shared component.
 */
export function HanCoinsInfoTrigger({
  balance,
  children,
  className,
  messages,
}: HanCoinsInfoTriggerProps) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <button
          type="button"
          className={cn(
            "rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
            className,
          )}
        >
          {children}
        </button>
      </ModalTrigger>
      <ModalContent className="max-h-[85dvh] max-w-lg overflow-y-auto p-0">
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 bg-linear-to-br from-accent-700 to-accent-500 px-5 py-3.5 pr-16">
            <HanCoinsIcon size={36} />
            <div className="flex-1 text-left">
              <ModalTitle className="text-card-title text-on-color-dark">
                HanCoins
              </ModalTitle>
              <Caption className="text-on-color-dark/80">
                {formatMessage(messages.balance, { balance })}
              </Caption>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 p-5">
            <ModalDescription>{messages.description}</ModalDescription>
            <Caption className="font-semibold uppercase tracking-wide text-text-muted">
              {messages.earnTitle}
            </Caption>
            {SOURCES.map((source) => (
              <div
                key={source.key}
                className="flex items-center gap-2.5 rounded-panel border border-border bg-surface px-3 py-2"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-500/15 text-accent-300">
                  <source.icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <Body className="font-medium text-text-primary">
                    {messages.sources[source.key].title}
                  </Body>
                  <Caption className="text-text-muted">
                    {messages.sources[source.key].detail}
                  </Caption>
                </div>
                <Chip tone="accent" size="sm" className="shrink-0">
                  {source.amount}
                </Chip>
              </div>
            ))}
            <Caption className="text-center text-text-muted">
              {messages.earnedOnly}
            </Caption>
          </div>
        </motion.div>
      </ModalContent>
    </Modal>
  );
}
