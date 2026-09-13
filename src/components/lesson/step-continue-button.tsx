import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLessonMessages } from "@/components/lesson/lesson-messages";

export function StepContinueButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label?: string;
}) {
  const messages = useLessonMessages();
  return (
    <Button type="button" onClick={onClick} className="mt-6 self-start">
      {label ?? messages.common.continue}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Button>
  );
}
