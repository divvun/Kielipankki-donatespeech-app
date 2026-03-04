import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Recording } from "../types";
import type { ThemeListItem } from "../types/Theme";
import type { Schedule } from "../types/Schedule";
import { getLocalizedText } from "../utils/localization";
import { useLocalization } from "../contexts/LocalizationContext";

export default function TestPage() {
  const { currentLanguage } = useLocalization();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [themes, setThemes] = useState<ThemeListItem[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchRecordings = async () => {
    console.log("Fetching recordings...");
    setLoading(true);
    setError("");
    try {
      const result = await invoke<Recording[]>("get_recordings");
      console.log("Received recordings:", result);
      setRecordings(result);
    } catch (err) {
      console.error("Error fetching recordings:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const insertTestRecording = async () => {
    console.log("Inserting test recording...");
    setLoading(true);
    setError("");
    try {
      await invoke("insert_test_recording");
      console.log("Test recording inserted successfully");
      // Automatically fetch recordings after insert
      await fetchRecordings();
    } catch (err) {
      console.error("Error inserting test recording:", err);
      setError(String(err));
      setLoading(false);
    }
  };

  const fetchThemes = async () => {
    console.log("Fetching themes from API...");
    setLoading(true);
    setError("");
    try {
      const result = await invoke<ThemeListItem[]>("fetch_themes");
      console.log("Received themes:", result);
      setThemes(result);
    } catch (err) {
      console.error("Error fetching themes:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    console.log("Fetching schedules from API...");
    setLoading(true);
    setError("");
    try {
      const result = await invoke<Schedule[]>("fetch_schedules");
      console.log("Received schedules:", result);
      setSchedules(result);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">API & Database Test Page</h1>

        {/* Database Section */}
        <div className="mb-8 p-6 bg-white rounded shadow">
          <h2 className="text-2xl font-semibold mb-4">Database Tests</h2>
          <div className="flex gap-4">
            <button
              onClick={fetchRecordings}
              disabled={loading}
              style={{
                backgroundColor: loading ? "#9CA3AF" : "#3B82F6",
                color: "white",
                padding: "0.5rem 1.5rem",
                borderRadius: "0.25rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Loading..." : "Fetch Recordings"}
            </button>

            <button
              onClick={insertTestRecording}
              disabled={loading}
              style={{
                backgroundColor: loading ? "#9CA3AF" : "#10B981",
                color: "white",
                padding: "0.5rem 1.5rem",
                borderRadius: "0.25rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Loading..." : "Insert Test Recording"}
            </button>
          </div>
        </div>

        {/* API Client Section */}
        <div className="mb-8 p-6 bg-white rounded shadow">
          <h2 className="text-2xl font-semibold mb-4">Backend API Tests</h2>
          <div className="flex gap-4">
            <button
              onClick={fetchThemes}
              disabled={loading}
              style={{
                backgroundColor: loading ? "#9CA3AF" : "#8B5CF6",
                color: "white",
                padding: "0.5rem 1.5rem",
                borderRadius: "0.25rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Loading..." : "Fetch Themes"}
            </button>

            <button
              onClick={fetchSchedules}
              disabled={loading}
              style={{
                backgroundColor: loading ? "#9CA3AF" : "#F59E0B",
                color: "white",
                padding: "0.5rem 1.5rem",
                borderRadius: "0.25rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Loading..." : "Fetch Schedules"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {recordings.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">
              Found {recordings.length} recording(s)
            </h2>
            <div className="space-y-4">
              {recordings.map((recording) => (
                <div
                  key={recording.recordingId}
                  className="bg-white p-4 rounded shadow"
                >
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
                          {JSON.stringify(
                            JSON.parse(recording.metadata),
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && recordings.length === 0 && !error && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded text-gray-600">
            No recordings found. Click "Fetch Recordings" to query the database.
          </div>
        )}

        {/* Themes Section */}
        {themes.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">
              Found {themes.length} theme(s)
            </h2>
            <div className="space-y-4">
              {themes.map((theme) => (
                <div key={theme.id} className="bg-white p-4 rounded shadow">
                  <div className="text-sm">
                    <div className="mb-2">
                      <span className="font-semibold">Theme ID:</span>{" "}
                      {theme.id || "N/A"}
                    </div>
                    {theme.content && (
                      <div className="space-y-2">
                        <div>
                          <span className="font-semibold">Title:</span>{" "}
                          {getLocalizedText(theme.content.title, currentLanguage) || "N/A"}
                        </div>
                        <div>
                          <span className="font-semibold">Body 1:</span>{" "}
                          {getLocalizedText(theme.content.body1, currentLanguage) || "N/A"}
                        </div>
                        {theme.content.body2 && (
                          <div>
                            <span className="font-semibold">Body 2:</span>{" "}
                            {getLocalizedText(theme.content.body2, currentLanguage) || "N/A"}
                          </div>
                        )}
                        {theme.content.image && (
                          <div>
                            <span className="font-semibold">Image:</span>{" "}
                            {theme.content.image}
                          </div>
                        )}
                        {theme.content.scheduleIds &&
                          theme.content.scheduleIds.length > 0 && (
                            <div>
                              <span className="font-semibold">
                                Schedule IDs:
                              </span>{" "}
                              {theme.content.scheduleIds.join(", ")}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedules Section */}
        {schedules.length > 0 && (
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
        )}

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <div className="text-sm font-mono">
            <div>Loading: {loading ? "true" : "false"}</div>
            <div>Recordings count: {recordings.length}</div>
            <div>Themes count: {themes.length}</div>
            <div>Schedules count: {schedules.length}</div>
            <div>Error: {error || "(none)"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
