import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, Square } from "lucide-react";

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
  const buttonLabel = isRecording ? stopLabel : startLabel;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_16px_rgba(26,25,24,0.03)] p-4 pb-10 flex flex-col items-center gap-3 shrink-0">
      {saving && (
        <div className="text-primary font-medium text-sm">
          Saving recording...
        </div>
      )}
      {error && (
        <Alert variant="destructive" className="max-w-sm mb-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {/* Timer */}
      <div className="text-[32px] font-extrabold text-foreground tracking-tight leading-none">
        {durationText}
      </div>
      {/* Record Button */}
      <button
        type="button"
        onClick={onRecord}
        disabled={saving}
        aria-label={buttonLabel}
        className={`w-18 h-18 rounded-full flex items-center justify-center border-none transition-transform hover:scale-105 active:scale-95 ${
          saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        style={{
          background: isRecording ? "#22c55e" : "#E05252",
          boxShadow: isRecording
            ? "0 4px 20px rgba(34,197,94,0.3)"
            : "0 4px 20px rgba(224,82,82,0.3)",
        }}
      >
        <div className="w-16 h-16 rounded-full border-[3px] border-white/40 flex items-center justify-center">
          {isRecording ? (
            <Square className="w-7 h-7 text-white" />
          ) : (
            <Mic className="w-7 h-7 text-white" />
          )}
        </div>
      </button>
      {/* Label */}
      <span className="text-[13px] text-muted-foreground">{buttonLabel}</span>
    </div>
  );
}
