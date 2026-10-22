import { notFound } from "next/navigation";
import { getLocalJourneyQualityReview } from "@/lib/journey-speaking-quality-data";
import { JourneyQualityReviewScreen } from "@/components/admin/journey-quality-review-screen";

export default async function SpeakingQualityPage({
  searchParams,
}: {
  searchParams: Promise<{ attempt?: string | string[] }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const query = await searchParams;
  if (
    query.attempt !== undefined &&
    (typeof query.attempt !== "string" ||
      !query.attempt ||
      query.attempt.length > 100)
  )
    notFound();
  const selected =
    typeof query.attempt === "string" && query.attempt.length <= 100
      ? query.attempt
      : undefined;
  const view = await getLocalJourneyQualityReview(selected);
  return <JourneyQualityReviewScreen view={view} />;
}
