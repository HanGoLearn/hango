import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StepContinueButton({
  onClick,
  label = "Continue",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button type="button" onClick={onClick} className="mt-6 self-start">
      {label}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Button>
  );
}
