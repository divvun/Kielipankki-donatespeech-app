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
    <div
      className="fixed bottom-0 left-0 right-0 bg-transparent px-6 pt-4 flex flex-col items-center"
      style={{
        paddingBottom:
          "calc(2.5rem + var(--inset-bottom, env(safe-area-inset-bottom)))",
      }}
    >
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
