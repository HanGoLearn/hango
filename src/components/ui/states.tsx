import { Loader2 } from "lucide-react";
import { Body, PageTitle, SectionTitle } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface LoadingStateProps {
  /** Explains the active process, e.g. "Loading your lesson." (ui.md). */
  message: string;
  className?: string;
}

export function LoadingState({ message, className }: LoadingStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-center",
        className,
      )}
    >
      <Loader2
        className="size-6 animate-spin text-primary-500"
        aria-hidden="true"
      />
      <Body className="text-text-secondary">{message}</Body>
    </div>
  );
}

/** Every document must have exactly one h1 — pass "h1" when this state is the entire page. */
type HeadingLevel = "h1" | "h2";

export interface EmptyStateProps {
  title: string;
  /** Explains why no content exists and what the learner should do next. */
  description: string;
  action?: { label: string; onClick: () => void };
  headingLevel?: HeadingLevel;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  headingLevel = "h2",
  className,
}: EmptyStateProps) {
  const Heading = headingLevel === "h1" ? PageTitle : SectionTitle;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-12 text-center",
        className,
      )}
    >
      <Heading>{title}</Heading>
      <Body className="max-w-sm text-text-secondary">{description}</Body>
      {action && (
        <Button variant="secondary" className="mt-2" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export interface ErrorStateProps {
  /** What happened. */
  title: string;
  /** What the learner can do. */
  description: string;
  onRetry?: () => void;
  headingLevel?: HeadingLevel;
  className?: string;
}

export function ErrorState({
  title,
  description,
  onRetry,
  headingLevel = "h2",
  className,
}: ErrorStateProps) {
  const Heading = headingLevel === "h1" ? PageTitle : SectionTitle;
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-12 text-center",
        className,
      )}
    >
      <Heading>{title}</Heading>
      <Body className="max-w-sm text-text-secondary">{description}</Body>
      {onRetry && (
        <Button variant="primary" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
