import { Button } from "./ui/button";

interface ScheduleStartActionsProps {
  onStart: () => void;
  startLabel: string;
}

export function ScheduleStartActions({
  onStart,
  startLabel,
}: ScheduleStartActionsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_16px_rgba(26,25,24,0.03)] px-6 py-4 pb-10 flex flex-col items-center">
      <Button
        onClick={onStart}
        size="lg"
        className="w-full text-base font-semibold rounded-full py-4 h-auto"
      >
        {startLabel}
      </Button>
    </div>
  );
}
