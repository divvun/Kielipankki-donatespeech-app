import { Heart } from "lucide-react";
import { BackButton } from "./BackButton";

interface DetailsHeaderProps {
  totalRecorded: string;
  onClose: () => void;
  backLabel: string;
}

export function DetailsHeader({
  totalRecorded,
  onClose,
  backLabel,
}: DetailsHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 min-h-[calc(44px+env(safe-area-inset-top))] pt-safe shrink-0">
      <BackButton onClick={onClose} label={backLabel} />

      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-primary text-[13px] font-semibold">
        <Heart className="w-3.5 h-3.5 fill-primary" />
        {totalRecorded}
      </div>
    </div>
  );
}
