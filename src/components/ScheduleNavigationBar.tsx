import { Heart } from "lucide-react";
import { BackButton } from "./BackButton";

interface ScheduleNavigationBarProps {
  onBack: () => void;
  totalRecorded: string;
  backLabel: string;
}

export function ScheduleNavigationBar({
  onBack,
  totalRecorded,
  backLabel,
}: ScheduleNavigationBarProps) {
  return (
    <>
      <div className="flex items-center justify-between px-5 h-14 shrink-0">
        <BackButton onClick={onBack} label={backLabel} />

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-primary text-[13px] font-semibold">
          <Heart className="w-3.5 h-3.5 fill-primary" />
          {totalRecorded}
        </div>
      </div>
    </>
  );
}
