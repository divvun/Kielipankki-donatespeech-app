import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import type { Schedule } from "../types/Schedule";
import { useTranslation } from "../hooks/useTranslation";
import { useTotalRecorded } from "../hooks/useTotalRecorded";
import { getLocalizedText } from "../utils/localization";
import { useLocalization } from "../contexts/LocalizationContext";

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
      const result = await invoke<Schedule>("fetch_schedule", {
        scheduleId: id,
      });
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
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <button
          onClick={handleBack}
          style={{
            backgroundColor: "transparent",
            color: "#3B82F6",
            padding: "0.5rem 1rem",
            borderRadius: "0.25rem",
            border: "1px solid #3B82F6",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          ← Back
        </button>

        {/* Donation Counter */}
        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-600 uppercase tracking-wide">
            {getString("DonatedLabelText")}
          </div>
          <div className="text-lg font-semibold text-blue-600">
            {totalRecorded.totalFormatted}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        <div className="max-w-2xl w-full">
          {/* Optional image */}
          {schedule?.start?.imageUrl && (
            <div className="mb-8 flex justify-center">
              <img
                src={schedule.start.imageUrl}
                alt=""
                className="max-w-md w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          )}

          <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">
            {schedule?.start?.title
              ? getLocalizedText(schedule.start.title, currentLanguage)
              : "Ready to begin"}
          </h1>

          <div className="text-center text-gray-700 space-y-4 mb-8">
            {schedule?.start?.body1 && (
              <p className="text-lg">
                {getLocalizedText(schedule.start.body1, currentLanguage)}
              </p>
            )}
            {schedule?.start?.body2 && (
              <p>
                {getLocalizedText(schedule.start.body2, currentLanguage)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 flex justify-center">
        <button
          onClick={handleStart}
          style={{
            backgroundColor: "#3B82F6",
            color: "white",
            padding: "0.75rem 2rem",
            borderRadius: "0.5rem",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "600",
            minWidth: "230px",
          }}
        >
          {getString("StartButtonText")}
        </button>
      </div>
    </div>
  );
}
