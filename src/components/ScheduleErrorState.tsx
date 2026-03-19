import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft } from "lucide-react";
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
  const normalizedError = error || "Failed to load schedule";

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-background flex flex-col items-center justify-center p-8 gap-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>{normalizedError}</AlertDescription>
      </Alert>
      <Button variant="outline" onClick={onBack} className="rounded-full">
        <ChevronLeft className="w-5 h-5 mr-1" />
        {backLabel}
      </Button>
    </div>
  );
}
