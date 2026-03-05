interface ScheduleItemNavigatorProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  currentIndex: number;
  totalItems: number;
}

function getArrowButtonStyle(enabled: boolean) {
  return {
    width: "50px",
    height: "50px",
    backgroundColor: "transparent",
    border: "none",
    cursor: enabled ? "pointer" : "not-allowed",
    opacity: enabled ? 1 : 0,
    fontSize: "2rem",
    color: "#3B82F6",
  };
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
        type="button"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        style={getArrowButtonStyle(canGoPrevious)}
      >
        ‹
      </button>

      <div className="text-center flex-1">
        <span className="text-lg font-semibold text-blue-600 uppercase">
          {currentIndex + 1} / {totalItems}
        </span>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        style={getArrowButtonStyle(canGoNext)}
      >
        ›
      </button>
    </div>
  );
}
