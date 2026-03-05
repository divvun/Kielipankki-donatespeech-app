interface ScheduleNavigationBarProps {
  onBack: () => void;
  donatedLabel: string;
  totalRecorded: string;
}

export function ScheduleNavigationBar({
  onBack,
  donatedLabel,
  totalRecorded,
}: ScheduleNavigationBarProps) {
  return (
    <div className="bg-white shadow-sm p-4 flex justify-between items-center">
      <button
        onClick={onBack}
        style={{
          backgroundColor: "transparent",
          color: "#3B82F6",
          padding: "0.5rem 1rem",
          borderRadius: "0.25rem",
          border: "1px solid #3B82F6",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        ← Back
      </button>

      <div className="flex flex-col items-end">
        <div className="text-xs text-gray-600 uppercase tracking-wide">
          {donatedLabel}
        </div>
        <div className="text-lg font-semibold text-blue-600">{totalRecorded}</div>
      </div>
    </div>
  );
}
