interface ScheduleItemNavigatorProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  currentIndex: number;
  totalItems: number;
}

export function ScheduleItemNavigator({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  currentIndex,
  totalItems,
}: ScheduleItemNavigatorProps) {
  return (
    <div className="flex items-center justify-between mb-6 px-4">
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        style={{
          width: "50px",
          height: "50px",
          backgroundColor: "transparent",
          border: "none",
          cursor: canGoPrevious ? "pointer" : "not-allowed",
          opacity: canGoPrevious ? 1 : 0,
          fontSize: "2rem",
          color: "#3B82F6",
        }}
      >
        ‹
      </button>

      <div className="text-center flex-1">
        <span className="text-lg font-semibold text-blue-600 uppercase">
          {currentIndex + 1} / {totalItems}
        </span>
      </div>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        style={{
          width: "50px",
          height: "50px",
          backgroundColor: "transparent",
          border: "none",
          cursor: canGoNext ? "pointer" : "not-allowed",
          opacity: canGoNext ? 1 : 0,
          fontSize: "2rem",
          color: "#3B82F6",
        }}
      >
        ›
      </button>
    </div>
  );
}
