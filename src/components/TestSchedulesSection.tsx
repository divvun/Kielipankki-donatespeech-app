import type { Schedule } from "../types/Schedule";
import { getLocalizedText } from "../utils/localization";

interface TestSchedulesSectionProps {
  schedules: Schedule[];
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

function getScheduleIdentifier(schedule: Schedule): string {
  return schedule.id || schedule.scheduleId || "N/A";
}

function getLocalizedTitle(
  title: Record<string, string> | null | undefined,
  currentLanguage: string,
): string {
  if (!title) {
    return "N/A";
  }

  return getLocalizedText(title, currentLanguage) || "N/A";
}

function getScheduleDisplayTitle(
  schedule: Schedule,
  currentLanguage: string,
): string {
  const startTitle = getLocalizedTitle(schedule.start?.title, currentLanguage);
  if (startTitle !== "N/A") {
    return startTitle;
  }

  return getLocalizedTitle(schedule.finish?.title, currentLanguage);
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
            <div className="text-sm space-y-2">
              {(() => {
                const displayTitle = getScheduleDisplayTitle(
                  schedule,
                  currentLanguage,
                );

                return displayTitle !== "N/A" ? (
                  <ScheduleFieldRow
                    label="Title"
                    value={displayTitle}
                    className="mb-2"
                  />
                ) : null;
              })()}
              <ScheduleFieldRow
                label="Schedule ID"
                value={getScheduleIdentifier(schedule)}
                className="mb-2"
              />
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
