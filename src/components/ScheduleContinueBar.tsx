import { Button } from "@/components/ui/button";

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
  const buttonLabel = isLastItem ? exitLabel : continueLabel;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_16px_rgba(26,25,24,0.03)] px-6 py-4 pb-10 flex flex-col items-center">
      {showManualContinueAfterFinish && saving && (
        <div className="text-blue-600 font-semibold">Saving recording...</div>
      )}
      {showManualContinueAfterFinish && recordingError && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {recordingError}
        </div>
      )}
      <Button
        onClick={onContinue}
        disabled={saving}
        size="lg"
        className="w-full text-base font-semibold rounded-full py-4 h-auto"
      >
        {buttonLabel}
      </Button>
    </div>
  );
}
