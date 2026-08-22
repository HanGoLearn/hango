import { PageTitle, Body } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <LogoMark className="size-10 text-text-primary" />
      <PageTitle>Welcome to HanGo</PageTitle>
      <Body className="text-text-secondary">
        A few quick questions so Han and your lessons can be tailored to you.
        This takes about a minute.
      </Body>
      <Button onClick={onNext} className="mt-2">
        Get started
      </Button>
    </div>
  );
}
