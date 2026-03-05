interface ScheduleContinueBarProps {
  showManualContinueAfterFinish: boolean;
  saving: boolean;
  recordingError: string | null;
  onContinue: () => void;
  isLastItem: boolean;
  exitLabel: string;
  continueLabel: string;
}

export function ScheduleContinueBar({
  showManualContinueAfterFinish,
  saving,
  recordingError,
  onContinue,
  isLastItem,
  exitLabel,
  continueLabel,
}: ScheduleContinueBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 flex flex-col items-center space-y-3">
      {showManualContinueAfterFinish && saving && (
        <div className="text-blue-600 font-semibold">Saving recording...</div>
      )}
      {showManualContinueAfterFinish && recordingError && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {recordingError}
        </div>
      )}
      <button
        onClick={onContinue}
        disabled={saving}
        style={{
          backgroundColor: "#3B82F6",
          color: "white",
          padding: "0.75rem 2rem",
          borderRadius: "0.5rem",
          border: "none",
          cursor: saving ? "not-allowed" : "pointer",
          fontSize: "1rem",
          fontWeight: "600",
          minWidth: "220px",
          opacity: saving ? 0.5 : 1,
        }}
      >
        {isLastItem ? exitLabel : continueLabel}
      </button>
    </div>
  );
}
