interface ScheduleErrorStateProps {
  error: string;
  onBack: () => void;
  backLabel: string;
}

export function ScheduleErrorState({
  error,
  onBack,
  backLabel,
}: ScheduleErrorStateProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <div className="mb-5 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <strong>Error:</strong> {error || "Failed to load schedule"}
      </div>
      <button
        onClick={onBack}
        style={{
          backgroundColor: "#3B82F6",
          color: "white",
          padding: "0.5rem 1.5rem",
          borderRadius: "0.25rem",
          border: "none",
          cursor: "pointer",
        }}
      >
        {backLabel}
      </button>
    </div>
  );
}
