import { useState } from "react";
import type { Recording } from "../types";
import type { ThemeListItem } from "../types/Theme";
import type { Schedule } from "../types/Schedule";
import { useLocalization } from "../contexts/LocalizationContext";
import { platformApi } from "../platform";
import { TestActionSection } from "../components/TestActionSection";
import { TestErrorBanner } from "../components/TestErrorBanner";
import { TestRecordingsSection } from "../components/TestRecordingsSection";
import { TestThemesSection } from "../components/TestThemesSection";
import { TestSchedulesSection } from "../components/TestSchedulesSection";
import { TestDebugInfo } from "../components/TestDebugInfo";

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
      const result = await platformApi.getRecordings();
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
      await platformApi.insertTestRecording();
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
      const result = await platformApi.fetchThemes();
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
      const result = await platformApi.fetchSchedules();
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

        <TestActionSection
          title="Database Tests"
          loading={loading}
          actions={[
            {
              label: "Fetch Recordings",
              color: "#3B82F6",
              onClick: fetchRecordings,
            },
            {
              label: "Insert Test Recording",
              color: "#10B981",
              onClick: insertTestRecording,
            },
          ]}
        />

        <TestActionSection
          title="Backend API Tests"
          loading={loading}
          actions={[
            {
              label: "Fetch Themes",
              color: "#8B5CF6",
              onClick: fetchThemes,
            },
            {
              label: "Fetch Schedules",
              color: "#F59E0B",
              onClick: fetchSchedules,
            },
          ]}
        />

        <TestErrorBanner error={error} />

        <TestRecordingsSection recordings={recordings} />

        {!loading && recordings.length === 0 && !error && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded text-gray-600">
            No recordings found. Click "Fetch Recordings" to query the database.
          </div>
        )}

        <TestThemesSection themes={themes} currentLanguage={currentLanguage} />

        <TestSchedulesSection
          schedules={schedules}
          currentLanguage={currentLanguage}
        />

        <TestDebugInfo
          loading={loading}
          recordingsCount={recordings.length}
          themesCount={themes.length}
          schedulesCount={schedules.length}
          error={error}
        />
      </div>
    </div>
  );
}
