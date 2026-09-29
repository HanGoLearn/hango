"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bug,
  CircleHelp,
  Lightbulb,
  MessageCircleQuestion,
  MessageSquarePlus,
  MessagesSquare,
  Star,
  type LucideIcon,
} from "lucide-react";
import {
  getMyBetaFeedbackAction,
  submitBetaFeedbackAction,
} from "@/lib/actions/beta-feedback";
import type {
  BetaFeedbackCategory,
  BetaFeedbackStatus,
} from "@/lib/beta-feedback";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import type { AppLocale } from "@/i18n/config";
import type { ShellMessages } from "@/i18n/messages/types";

type FeedbackMessages = ShellMessages["feedback"];
type RecentFeedback = Awaited<
  ReturnType<typeof getMyBetaFeedbackAction>
>[number];

const CATEGORY_META: Record<
  BetaFeedbackCategory,
  { icon: LucideIcon; label: keyof FeedbackMessages["categories"] }
> = {
  BUG: { icon: Bug, label: "bug" },
  IDEA: { icon: Lightbulb, label: "idea" },
  CONFUSING: { icon: CircleHelp, label: "confusing" },
  LESSON_CONTENT: { icon: BookOpen, label: "lessonContent" },
  HAN: { icon: MessagesSquare, label: "han" },
  OTHER: { icon: MessageCircleQuestion, label: "other" },
};

const STATUS_KEYS: Record<
  BetaFeedbackStatus,
  keyof FeedbackMessages["statuses"]
> = {
  NEW: "new",
  REVIEWING: "reviewing",
  RESOLVED: "resolved",
};

export function FeedbackWidget({
  locale,
  messages,
}: {
  locale: AppLocale;
  messages: FeedbackMessages;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<BetaFeedbackCategory>("BUG");
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<
    "SUCCESS" | "INVALID" | "RATE_LIMITED" | "UNAUTHORIZED" | "ERROR" | null
  >(null);
  const [recent, setRecent] = useState<RecentFeedback[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [pending, startTransition] = useTransition();

  const loadHistory = useCallback(() => {
    void getMyBetaFeedbackAction().then((items) => {
      setRecent(items);
      setHistoryLoaded(true);
    });
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen && !historyLoaded) loadHistory();
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      const response = await submitBetaFeedbackAction({
        category,
        rating,
        message,
        path: pathname,
        locale,
      });
      if (response.ok) {
        setResult("SUCCESS");
        setMessage("");
        setRating(null);
        loadHistory();
      } else {
        setResult(response.code);
      }
    });
  }

  const errorMessage =
    result && result !== "SUCCESS"
      ? result === "RATE_LIMITED"
        ? messages.errors.rateLimited
        : result === "UNAUTHORIZED"
          ? messages.errors.unauthorized
          : result === "INVALID"
            ? messages.errors.invalid
            : messages.errors.generic
      : null;

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-3 z-[45] inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 font-interface text-supporting font-semibold text-text-primary shadow-card transition-transform hover:-translate-y-0.5 hover:bg-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 md:bottom-4 md:left-4"
        aria-label={messages.open}
      >
        <MessageSquarePlus
          className="size-5 text-primary-400"
          aria-hidden="true"
        />
        <span>{messages.open}</span>
      </button>

      <ModalContent className="max-w-2xl">
        <ModalTitle className="pr-12">{messages.title}</ModalTitle>
        <ModalDescription className="mt-1">
          {messages.description}
        </ModalDescription>

        {result === "SUCCESS" ? (
          <div className="mt-6 rounded-card border border-secondary-500/30 bg-secondary-500/10 p-5">
            <h3 className="font-display text-card-title font-semibold text-text-primary">
              {messages.successTitle}
            </h3>
            <p className="mt-1 font-interface text-supporting text-text-secondary">
              {messages.successMessage}
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-4"
              onClick={() => setResult(null)}
            >
              {messages.sendAnother}
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 flex flex-col gap-5">
            <fieldset>
              <legend className="font-interface text-supporting font-semibold text-text-primary">
                {messages.categoryLabel}
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {(
                  Object.entries(CATEGORY_META) as [
                    BetaFeedbackCategory,
                    (typeof CATEGORY_META)[BetaFeedbackCategory],
                  ][]
                ).map(([value, meta]) => {
                  const Icon = meta.icon;
                  const selected = category === value;
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-center gap-3 rounded-control border px-3 py-2 font-interface text-supporting transition-colors",
                        selected
                          ? "border-primary-500 bg-primary-500/10 text-text-primary"
                          : "border-border bg-surface text-text-secondary hover:bg-elevated",
                      )}
                    >
                      <input
                        type="radio"
                        name="feedback-category"
                        value={value}
                        checked={selected}
                        onChange={() => setCategory(value)}
                        className="sr-only"
                      />
                      <Icon
                        className="size-5 shrink-0 text-primary-400"
                        aria-hidden="true"
                      />
                      <span>{messages.categories[meta.label]}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-interface text-supporting font-semibold text-text-primary">
                {messages.ratingLabel}{" "}
                <span className="font-normal text-text-muted">
                  ({messages.optional})
                </span>
              </legend>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(rating === value ? null : value)}
                    className="flex size-11 items-center justify-center rounded-control hover:bg-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                    aria-label={messages.ratingAria.replace(
                      "{rating}",
                      String(value),
                    )}
                    aria-pressed={rating === value}
                  >
                    <Star
                      className={cn(
                        "size-6",
                        rating !== null && value <= rating
                          ? "fill-accent-300 text-accent-300"
                          : "text-text-muted",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </fieldset>

            <Textarea
              label={messages.messageLabel}
              placeholder={messages.messagePlaceholder}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              minLength={2}
              maxLength={2000}
              showCharacterCount
              required
              disabled={pending}
            />

            {errorMessage && (
              <p
                role="alert"
                className="rounded-control bg-error-500/10 px-3 py-2 font-interface text-supporting text-error-500"
              >
                {errorMessage}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              loading={pending}
              className="w-full sm:w-auto sm:self-end"
            >
              {messages.send}
            </Button>
          </form>
        )}

        <RecentFeedbackList
          locale={locale}
          messages={messages}
          items={recent}
          loaded={historyLoaded}
        />
      </ModalContent>
    </Modal>
  );
}

function RecentFeedbackList({
  locale,
  messages,
  items,
  loaded,
}: {
  locale: AppLocale;
  messages: FeedbackMessages;
  items: RecentFeedback[];
  loaded: boolean;
}) {
  if (!loaded) return null;
  return (
    <details className="mt-6 border-t border-border pt-4">
      <summary className="cursor-pointer font-interface text-supporting font-semibold text-text-primary">
        {messages.recentTitle}
      </summary>
      {!items.length ? (
        <p className="mt-3 font-interface text-supporting text-text-muted">
          {messages.noRecent}
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-card bg-elevated p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-surface px-2.5 py-1 font-interface text-caption font-semibold text-text-secondary">
                  {messages.statuses[STATUS_KEYS[item.status]]}
                </span>
                <time className="font-interface text-caption text-text-muted">
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                  }).format(new Date(item.createdAt))}
                </time>
              </div>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap font-interface text-supporting text-text-secondary">
                {item.message}
              </p>
              {item.adminResponse && (
                <div className="mt-3 border-l-2 border-primary-400 pl-3">
                  <p className="font-interface text-caption font-semibold uppercase tracking-wide text-primary-400">
                    {messages.responseLabel}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap font-interface text-supporting text-text-primary">
                    {item.adminResponse}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </details>
  );
}
