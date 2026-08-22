import { SectionTitle, Body } from "@/components/ui/typography";
import { InformationBanner } from "@/components/ui/banner";
import { StepContinueButton } from "@/components/lesson/step-continue-button";

/**
 * Shared shell for the step types 6.3 explicitly allows as placeholders
 * until their dedicated phases exist (Speaking - FASE 10, Writing - FASE
 * 11, Quiz - FASE 7.4).
 */
export function PlaceholderStep({
  title,
  description,
  comingIn,
  onContinue,
}: {
  title: string;
  description: string;
  comingIn: string;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>{title}</SectionTitle>
      <Body>{description}</Body>
      <InformationBanner variant="info" title={`Coming in ${comingIn}`}>
        This step is a placeholder for now - it will become fully interactive
        once that phase is built.
      </InformationBanner>
      <StepContinueButton onClick={onContinue} />
    </div>
  );
}
