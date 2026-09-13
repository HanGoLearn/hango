"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellRing, PartyPopper, Wrench } from "lucide-react";
import {
  acknowledgeAnnouncementAction,
  getPendingAnnouncementsAction,
  type LearnerAnnouncement,
} from "@/lib/actions/learner-notices";
import { Button } from "@/components/ui/button";
import { localeAwareHref, type AppLocale } from "@/i18n/config";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from "@/components/ui/modal";

export function AnnouncementCenter({ locale }: { locale: AppLocale }) {
  const pathname = usePathname();
  const [queue, setQueue] = useState<LearnerAnnouncement[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getPendingAnnouncementsAction().then((items) => {
      if (!cancelled)
        setQueue((current) => {
          const currentIds = new Set(current.map((item) => item.id));
          return [
            ...current,
            ...items.filter((item) => !currentIds.has(item.id)),
          ];
        });
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const current = queue[0] ?? null;
  const dismiss = useCallback(() => {
    if (!current) return;
    void acknowledgeAnnouncementAction(current.id);
    setQueue((items) => items.slice(1));
  }, [current]);

  if (!current) return null;
  const Icon =
    current.type === "MAINTENANCE"
      ? Wrench
      : current.type === "CELEBRATION"
        ? PartyPopper
        : BellRing;

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
    >
      <ModalContent className="max-w-lg">
        <div className="mb-4 flex size-12 items-center justify-center rounded-card bg-primary-500/15 text-primary-400">
          <Icon className="size-6" aria-hidden="true" />
        </div>
        <p className="font-interface text-caption font-semibold uppercase tracking-[0.1em] text-primary-400">
          Novedad en HanGo
        </p>
        <ModalTitle className="mt-1">{current.title}</ModalTitle>
        <ModalDescription className="mt-3 whitespace-pre-wrap text-body">
          {current.message}
        </ModalDescription>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={dismiss}>
            {queue.length > 1 ? "Siguiente" : "Entendido"}
          </Button>
          {current.ctaHref && current.ctaLabel && (
            <Link
              href={localeAwareHref(locale, current.ctaHref)}
              onClick={dismiss}
              className="inline-flex items-center justify-center rounded-control bg-primary-500 px-4 py-2 font-interface text-body font-medium text-on-color-light transition-colors hover:bg-primary-600"
            >
              {current.ctaLabel}
            </Link>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
