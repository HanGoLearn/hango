"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Body, Caption, CardTitle } from "@/components/ui/typography";
import { useAiTeacher } from "@/components/ai-teacher/ai-teacher-provider";
import { completeReviewItemAction } from "@/lib/actions/review";
import type { ReviewItem } from "@/lib/review-queue";

export function ReviewQueueList({ items }: { items: ReviewItem[] }) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const { openTeacher, setMode } = useAiTeacher();

  async function handleAction(item: ReviewItem) {
    if (item.type === "AI_PRACTICE") {
      setMode("PRACTICE");
      await openTeacher({});
      return;
    }
    setCompleted((current) => new Set(current).add(item.id));
    await completeReviewItemAction(item.type, item.itemKey);
  }

  const visibleItems = items.filter((item) => !completed.has(item.id));

  return (
    <div className="flex flex-col gap-2">
      {visibleItems.map((item) => (
        <Card key={item.id} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            {item.type === "AI_PRACTICE" && (
              <Sparkles
                className="size-4 text-primary-500"
                aria-hidden="true"
              />
            )}
            <CardTitle>{item.title}</CardTitle>
          </div>
          <Body className="text-text-secondary">{item.reason}</Body>
          <div className="flex items-center justify-between">
            <Caption>~{item.estimatedMinutes} min</Caption>
            {item.actionHref ? (
              <Link href={item.actionHref}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleAction(item)}
                >
                  {item.actionLabel}
                </Button>
              </Link>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleAction(item)}
              >
                {item.actionLabel}
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
