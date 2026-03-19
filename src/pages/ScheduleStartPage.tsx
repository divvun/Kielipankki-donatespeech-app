import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStateMediaUrl, type Schedule } from "../types/Schedule";
import { useTranslation } from "../hooks/useTranslation";
import { useTotalRecorded } from "../hooks/useTotalRecorded";
import { getLocalizedText } from "../utils/localization";
import { useLocalization } from "../contexts/LocalizationContext";
import { platformApi } from "../platform";
import { ScheduleNavigationBar } from "../components/ScheduleNavigationBar";
import { ScheduleStartSummary } from "../components/ScheduleStartSummary";
import { ScheduleStartActions } from "../components/ScheduleStartActions";

export default function ScheduleStartPage() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const { getString } = useTranslation();
  const totalRecorded = useTotalRecorded();
  const { currentLanguage } = useLocalization();

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (scheduleId) {
      loadSchedule(scheduleId);
    }
  }, [scheduleId]);

  const loadSchedule = async (id: string) => {
    console.log("Loading schedule for start page:", id);
    setLoading(true);
    setError("");
    try {
      const result = await platformApi.fetchSchedule(id);
      console.log("Received schedule:", result);

      if (!result.items || result.items.length === 0) {
        setError("This schedule has no content.");
        return;
      }

      setSchedule(result);
    } catch (err) {
      console.error("Error loading schedule:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (!schedule || !scheduleId) return;

    // Navigate to the schedule page to begin
    navigate(`/schedule/${scheduleId}`);
  };

  const handleBack = () => {
    navigate("/themes");
  };

  const startTitle = schedule?.start?.title
    ? getLocalizedText(schedule.start.title, currentLanguage)
    : "Ready to begin";
  const startBody1 = schedule?.start?.body1
    ? getLocalizedText(schedule.start.body1, currentLanguage)
    : "";
  const startBody2 = schedule?.start?.body2
    ? getLocalizedText(schedule.start.body2, currentLanguage)
    : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Back to Themes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <ScheduleNavigationBar
        onBack={handleBack}
        totalRecorded={totalRecorded.totalFormatted}
      />

      <ScheduleStartSummary
        startImageUrl={getStateMediaUrl(schedule?.start)}
        title={startTitle}
        body1={startBody1}
        body2={startBody2}
      />

      <ScheduleStartActions
        onStart={handleStart}
        startLabel={getString("StartButtonText")}
      />
    </div>
  );
}
