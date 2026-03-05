import type { Schedule } from "../types/Schedule";
import { getLocalizedText } from "../utils/localization";

interface TestSchedulesSectionProps {
  schedules: Schedule[];
  currentLanguage: string;
}

export function TestSchedulesSection({
  schedules,
  currentLanguage,
}: TestSchedulesSectionProps) {
  if (schedules.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">
        Found {schedules.length} schedule(s)
      </h2>
      <div className="space-y-4">
        {schedules.map((schedule) => (
          <div
            key={schedule.id || schedule.scheduleId}
            className="bg-white p-4 rounded shadow"
          >
            <div className="text-sm">
              <div className="mb-2">
                <span className="font-semibold">Schedule ID:</span>{" "}
                {schedule.id || schedule.scheduleId || "N/A"}
              </div>
              {schedule.title && (
                <div className="mb-2">
                  <span className="font-semibold">Title:</span>{" "}
                  {getLocalizedText(schedule.title, currentLanguage) || "N/A"}
                </div>
              )}
              {schedule.items && schedule.items.length > 0 && (
                <div>
                  <span className="font-semibold">Items:</span>{" "}
                  {schedule.items.length} item(s)
                  <pre className="text-xs mt-1 bg-gray-50 p-2 rounded overflow-x-auto max-h-60">
                    {JSON.stringify(schedule.items, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
