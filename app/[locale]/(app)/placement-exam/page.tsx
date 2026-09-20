import { redirect } from "next/navigation";
import { startPlacementExamAction } from "@/lib/actions/placement-exam";
import { PlacementExamHome } from "@/components/placement/placement-exam-home";
import { isAppLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/**
 * Adaptive placement exam pilot (HSK1-2 only, project/TASKS.md - "Adaptive
 * placement exam"). Deliberately not linked from the primary nav yet
 * (src/lib/navigation.ts's own doc comment flags that list as controlled
 * by branding.md) - reachable directly at this URL for testing the full
 * mechanism end to end before deciding whether/how it surfaces in product
 * navigation.
 */
export default async function PlacementExamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isAppLocale(localeParam)) return null;
  const locale = localeParam;
  const dictionary = await getDictionary(locale);
  const started = await startPlacementExamAction();
  if (!started.ok) {
    redirect(localePath(locale, "/dashboard"));
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 md:p-8">
      <PlacementExamHome
        locale={locale}
        messages={dictionary.onboarding.placementExam}
        sessionId={started.value.sessionId}
        initialQuestion={started.value.question}
        initialResult={started.value.result}
      />
    </div>
  );
}
