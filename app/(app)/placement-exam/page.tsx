import { redirect } from "next/navigation";
import { startPlacementExamAction } from "@/lib/actions/placement-exam";
import { PlacementExamHome } from "@/components/placement/placement-exam-home";

/**
 * Adaptive placement exam pilot (HSK1-2 only, project/TASKS.md - "Adaptive
 * placement exam"). Deliberately not linked from the primary nav yet
 * (src/lib/navigation.ts's own doc comment flags that list as controlled
 * by branding.md) - reachable directly at this URL for testing the full
 * mechanism end to end before deciding whether/how it surfaces in product
 * navigation.
 */
export default async function PlacementExamPage() {
  const started = await startPlacementExamAction();
  if (!started.ok) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 md:p-8">
      <PlacementExamHome
        sessionId={started.value.sessionId}
        initialQuestion={started.value.question}
      />
    </div>
  );
}
