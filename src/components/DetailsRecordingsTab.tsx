import type { Recording } from "../types";
import { formatTotalRecorded } from "../utils/preferences";

export interface RecordingWithDuration extends Recording {
  duration?: number;
}

interface DetailsRecordingsTabProps {
  loading: boolean;
  error: string;
  recordings: RecordingWithDuration[];
  deletingId: string | null;
  onDelete: (recording: RecordingWithDuration) => void;
}

const statusBadgeClasses: Record<string, string> = {
  uploaded: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  deleted: "bg-red-100 text-red-800",
};

const tableHeaders = [
  { label: "Filename", className: "text-left" },
  { label: "Duration", className: "text-left" },
  { label: "Recorded", className: "text-left" },
  { label: "Status", className: "text-left" },
  { label: "Action", className: "text-right" },
];

function formatDuration(seconds?: number): string {
  if (seconds === undefined) return "Unknown";
  if (seconds < 1) return "<1 sec";
  if (seconds < 60) return `${Math.floor(seconds)} sec`;
  return formatTotalRecorded(seconds);
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch {
    return timestamp;
  }
}

function getStatusBadgeColor(status?: string): string {
  if (!status) {
    return "bg-gray-100 text-gray-800";
  }

  return statusBadgeClasses[status.toLowerCase()] || "bg-gray-100 text-gray-800";
}

export function DetailsRecordingsTab({
  loading,
  error,
  recordings,
  deletingId,
  onDelete,
}: DetailsRecordingsTabProps) {
  if (loading) {
    return (
      <div className="text-center text-gray-600">Loading recordings...</div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {error}
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="text-center text-gray-600">
        No recordings found. Start recording to donate your speech!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {tableHeaders.map((header) => (
              <th
                key={header.label}
                className={`px-6 py-3 ${header.className} text-xs font-medium text-gray-500 uppercase tracking-wider`}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {recordings.map((recording) => (
            <tr key={recording.recordingId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {recording.fileName || "Unknown"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDuration(recording.duration)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatTimestamp(recording.timestamp)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                    recording.uploadStatus,
                  )}`}
                >
                  {recording.uploadStatus || "Unknown"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onDelete(recording)}
                  disabled={deletingId === recording.recordingId}
                  className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                >
                  {deletingId === recording.recordingId
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
