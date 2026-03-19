import { useTranslation } from "../hooks/useTranslation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingActionsProps {
  onContinue: () => void;
}

export function OnboardingActions({ onContinue }: OnboardingActionsProps) {
  const { getString } = useTranslation();

  return (
    <div className="px-6 pb-10 pt-4">
      <Button
        onClick={onContinue}
        size="lg"
        className="w-full text-base font-semibold rounded-full py-4 h-auto"
      >
        {getString("OnboardingCTA")}
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}
