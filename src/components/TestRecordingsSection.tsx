import type { Recording } from "../types";

interface TestRecordingsSectionProps {
  recordings: Recording[];
}

interface RecordingFieldRowProps {
  label: string;
  value: string;
}

function RecordingFieldRow({ label, value }: RecordingFieldRowProps) {
  return (
    <div>
      <span className="font-semibold">{label}:</span> {value}
    </div>
  );
}

function displayValue(value?: string): string {
  return value || "N/A";
}

function formatMetadata(metadata?: string): string | null {
  if (!metadata) {
    return null;
  }

  try {
    return JSON.stringify(JSON.parse(metadata), null, 2);
  } catch {
    return metadata;
  }
}

export function TestRecordingsSection({
  recordings,
}: TestRecordingsSectionProps) {
  if (recordings.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">
        Found {recordings.length} recording(s)
      </h2>
      <div className="space-y-4">
        {recordings.map((recording) => {
          const metadata = formatMetadata(recording.metadata);

          return (
            <div key={recording.recordingId} className="bg-white p-4 rounded shadow">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <RecordingFieldRow
                  label="Recording ID"
                  value={recording.recordingId}
                />
                <RecordingFieldRow
                  label="Item ID"
                  value={displayValue(recording.itemId)}
                />
                <RecordingFieldRow
                  label="File Name"
                  value={displayValue(recording.fileName)}
                />
                <RecordingFieldRow
                  label="Client ID"
                  value={displayValue(recording.clientId)}
                />
                <RecordingFieldRow
                  label="Timestamp"
                  value={recording.timestamp}
                />
                <RecordingFieldRow
                  label="Upload Status"
                  value={displayValue(recording.uploadStatus)}
                />
                {metadata && (
                  <div className="col-span-2">
                    <span className="font-semibold">Metadata:</span>{" "}
                    <pre className="text-xs mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
                      {metadata}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
