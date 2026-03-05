interface ScheduleStartActionsProps {
  onStart: () => void;
  startLabel: string;
}

const startButtonStyle = {
  backgroundColor: "#3B82F6",
  color: "white",
  padding: "0.75rem 2rem",
  borderRadius: "0.5rem",
  border: "none",
  cursor: "pointer",
  fontSize: "1rem",
  fontWeight: "600",
  minWidth: "230px",
};

export function ScheduleStartActions({
  onStart,
  startLabel,
}: ScheduleStartActionsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 flex justify-center">
      <button type="button" onClick={onStart} style={startButtonStyle}>
        {startLabel}
      </button>
    </div>
  );
}
