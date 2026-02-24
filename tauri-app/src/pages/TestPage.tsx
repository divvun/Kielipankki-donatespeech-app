import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Recording } from "../types";

export default function TestPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Database Test Page</h1>
        
        <div className="flex gap-4">
          <button
            onClick={fetchRecordings}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Loading..." : "Fetch Recordings"}
          </button>

          <button
            onClick={insertTestRecording}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Loading..." : "Insert Test Recording"}
          </button>
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
                            2
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

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <div className="text-sm font-mono">
            <div>Loading: {loading ? "true" : "false"}</div>
            <div>Recordings count: {recordings.length}</div>
            <div>Error: {error || "(none)"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
