interface ScheduleRecordingBarProps {
  saving: boolean;
  error: string | null;
  onRecord: () => void;
  isRecording: boolean;
  startLabel: string;
  stopLabel: string;
  durationText: string;
}

export function ScheduleRecordingBar({
  saving,
  error,
  onRecord,
  isRecording,
  startLabel,
  stopLabel,
  durationText,
}: ScheduleRecordingBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 flex flex-col items-center">
      {saving && <div className="mb-4 text-blue-600 font-semibold">Saving recording...</div>}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <button
        onClick={onRecord}
        disabled={saving}
        style={{
          width: "91px",
          height: "91px",
          borderRadius: "50%",
          backgroundColor: isRecording ? "#10B981" : "#EF4444",
          color: "white",
          border: "none",
          cursor: saving ? "not-allowed" : "pointer",
          fontSize: "1rem",
          fontWeight: "600",
          opacity: saving ? 0.5 : 1,
        }}
      >
        {isRecording ? stopLabel : startLabel}
      </button>
      <div className="mt-3 text-2xl font-mono text-gray-700">{durationText}</div>
    </div>
  );
}
