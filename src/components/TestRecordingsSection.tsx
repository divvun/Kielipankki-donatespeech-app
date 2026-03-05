import type { Recording } from "../types";

interface TestRecordingsSectionProps {
  recordings: Recording[];
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
        {recordings.map((recording) => (
          <div key={recording.recordingId} className="bg-white p-4 rounded shadow">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-semibold">Recording ID:</span>{" "}
                {recording.recordingId}
              </div>
              <div>
                <span className="font-semibold">Item ID:</span>{" "}
                {recording.itemId || "N/A"}
              </div>
              <div>
                <span className="font-semibold">File Name:</span>{" "}
                {recording.fileName || "N/A"}
              </div>
              <div>
                <span className="font-semibold">Client ID:</span>{" "}
                {recording.clientId || "N/A"}
              </div>
              <div>
                <span className="font-semibold">Timestamp:</span>{" "}
                {recording.timestamp}
              </div>
              <div>
                <span className="font-semibold">Upload Status:</span>{" "}
                {recording.uploadStatus || "N/A"}
              </div>
              {recording.metadata && (
                <div className="col-span-2">
                  <span className="font-semibold">Metadata:</span>{" "}
                  <pre className="text-xs mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(JSON.parse(recording.metadata), null, 2)}
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
