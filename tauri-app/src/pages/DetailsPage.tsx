import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import type { Recording } from "../types";
import { useTotalRecorded } from "../hooks/useTotalRecorded";
import {
  formatTotalRecorded,
  subtractRecordedSeconds,
} from "../utils/preferences";

interface RecordingWithDuration extends Recording {
  duration?: number;
}

export default function DetailsPage() {
  const [recordings, setRecordings] = useState<RecordingWithDuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const totalRecorded = useTotalRecorded();

  const fetchRecordings = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await invoke<Recording[]>("get_recordings");
      
      // Parse metadata to extract duration
      const recordingsWithDuration = result.map((rec) => {
        let duration: number | undefined;
        if (rec.metadata) {
          try {
            const metadata = JSON.parse(rec.metadata);
            duration = metadata.recordingDuration || metadata.recording_duration;
          } catch (e) {
            console.error("Failed to parse metadata for", rec.recordingId, e);
          }
        }
        return { ...rec, duration };
      });

      setRecordings(recordingsWithDuration);
    } catch (err) {
      console.error("Failed to fetch recordings:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const handleDelete = async (recording: RecordingWithDuration) => {
    if (!confirm(`Delete recording "${recording.fileName}"?`)) {
      return;
    }

    setDeletingId(recording.recordingId);
    try {
      await invoke("delete_recording", {
        recordingId: recording.recordingId,
      });

      // Subtract duration from total recorded time
      if (recording.duration) {
        subtractRecordedSeconds(Math.floor(recording.duration));
      }

      // Remove from local state
      setRecordings((prev) =>
        prev.filter((r) => r.recordingId !== recording.recordingId)
      );

      // Refresh total recorded time display
      totalRecorded.refresh();
    } catch (err) {
      console.error("Failed to delete recording:", err);
      alert(`Failed to delete recording: ${err}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClose = () => {
    navigate("/themes");
  };

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
    } catch (e) {
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Donated Recordings</h1>

        {/* Donation Counter */}
        <div className="flex flex-col items-end mr-4">
          <div className="text-xs text-gray-600 uppercase tracking-wide">
            YOU HAVE DONATED
          </div>
          <div className="text-lg font-semibold text-blue-600">
            {totalRecorded.totalFormatted}
          </div>
        </div>

        <button
          onClick={handleClose}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {loading && (
          <div className="text-center text-gray-600">
            Loading recordings...
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        )}

        {!loading && !error && recordings.length === 0 && (
          <div className="text-center text-gray-600">
            No recordings found. Start recording to donate your speech!
          </div>
        )}

        {!loading && !error && recordings.length > 0 && (
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
                          recording.uploadStatus
                        )}`}
                      >
                        {recording.uploadStatus || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(recording)}
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
        )}
      </div>
    </div>
  );
}
