import type { ScheduleAvailability } from "../types/Schedule";
import { getLocalizedText } from "../utils/localization";

interface TestSchedulesSectionProps {
  schedules: ScheduleAvailability[];
  currentLanguage: string;
}

interface ScheduleFieldRowProps {
  label: string;
  value: string;
  className?: string;
}

function ScheduleFieldRow({ label, value, className }: ScheduleFieldRowProps) {
  return (
    <div className={className}>
      <span className="font-semibold">{label}:</span> {value}
    </div>
  );
}

function getAvailableLanguagesDisplay(
  schedule: ScheduleAvailability,
  currentLanguage: string,
): string {
  if (schedule.availableLanguages.length === 0) {
    return getLocalizedText("N/A", currentLanguage);
  }

  return schedule.availableLanguages.join(", ");
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
          <div key={schedule.id} className="bg-white p-4 rounded shadow">
            <div className="text-sm space-y-2">
              <ScheduleFieldRow
                label="Schedule ID"
                value={schedule.id || "N/A"}
                className="mb-2"
              />
              <ScheduleFieldRow
                label="Available languages"
                value={getAvailableLanguagesDisplay(schedule, currentLanguage)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
