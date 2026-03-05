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

export function DetailsRecordingsTab({
  loading,
  error,
  recordings,
  deletingId,
  onDelete,
}: DetailsRecordingsTabProps) {
  const formatDuration = (seconds?: number): string => {
    if (seconds === undefined) return "Unknown";
    if (seconds < 1) return "<1 sec";
    if (seconds < 60) return `${Math.floor(seconds)} sec`;
    return formatTotalRecorded(seconds);
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getStatusBadgeColor = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case "uploaded":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "deleted":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Filename
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Duration
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recorded
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
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
