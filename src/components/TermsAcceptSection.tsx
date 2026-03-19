import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface TermsAcceptSectionProps {
  acceptLabel: string;
  onAccept: () => void;
}

export function TermsAcceptSection({
  acceptLabel,
  onAccept,
}: TermsAcceptSectionProps) {
  return (
    <div className="px-6 pb-10 pt-4">
      <Button
        onClick={onAccept}
        size="lg"
        className="w-full text-base font-semibold rounded-full py-4 h-auto"
      >
        {acceptLabel}
        <Check className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}
