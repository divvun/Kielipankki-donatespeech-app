import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScheduleItemNavigatorProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  currentIndex: number;
}

export function ScheduleItemNavigator({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  currentIndex,
}: ScheduleItemNavigatorProps) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        aria-label="Previous"
        className={`w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center transition-colors ${
          canGoPrevious
            ? "cursor-pointer hover:border-muted-foreground"
            : "opacity-30 cursor-default"
        }`}
      >
        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
      </button>

      <span className="text-base text-foreground">{currentIndex + 1}</span>

      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Next"
        className={`w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center transition-colors ${
          canGoNext
            ? "cursor-pointer hover:border-muted-foreground"
            : "opacity-30 cursor-default"
        }`}
      >
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>
    </div>
  );
}
