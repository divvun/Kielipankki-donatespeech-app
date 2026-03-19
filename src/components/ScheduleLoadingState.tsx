import { Spinner } from "@/components/ui/spinner";
export function ScheduleLoadingState() {
  return (
    <div className="min-h-screen bg-linear-to-b from-white to-background flex items-center justify-center">
      <Spinner className="w-10 h-10" />
    </div>
  );
}
