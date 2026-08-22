"use server";

import { auth } from "@/lib/auth";
import { completeReviewItem } from "@/lib/review-data";
import type { ReviewItemType } from "@/lib/review-queue";

export async function completeReviewItemAction(
  itemType: ReviewItemType,
  itemKey: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  await completeReviewItem(session.user.id, itemType, itemKey);
}
