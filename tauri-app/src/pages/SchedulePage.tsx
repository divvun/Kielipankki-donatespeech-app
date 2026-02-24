import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useParams, useNavigate } from "react-router-dom";
import type { Schedule } from "../types/Schedule";
import { isMediaItem, isPromptItem } from "../types/Schedule";
import { useRecording, formatDuration } from "../hooks/useRecording";
import { AudioPlayer } from "../components/AudioPlayer";
import { VideoPlayer } from "../components/VideoPlayer";
import { getMediaUrl } from "../utils/mediaUrl";
import { useTotalRecorded } from "../hooks/useTotalRecorded";
import { addRecordedSeconds } from "../utils/preferences";
import { useAutoUpload } from "../hooks/useAutoUpload";

export default function SchedulePage() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string>("");
  const [mediaError, setMediaError] = useState<string>("");

  const recording = useRecording();
  const totalRecorded = useTotalRecorded();
  const autoUpload = useAutoUpload();

  useEffect(() => {
    if (scheduleId) {
      loadSchedule(scheduleId);
    }
  }, [scheduleId]);

  const loadSchedule = async (id: string) => {
    console.log("Loading schedule:", id);
    setLoading(true);
    setError("");
    try {
      const result = await invoke<Schedule>("fetch_schedule", {
        scheduleId: id,
      });
      console.log("Received schedule:", result);

      if (!result.items || result.items.length === 0) {
        setError("Schedule has no items");
        return;
      }

      setSchedule(result);
      setCurrentIndex(0);
    } catch (err) {
      console.error("Error loading schedule:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Load media URL when current item changes
  useEffect(() => {
    const loadMediaUrl = async () => {
      if (schedule && schedule.items[currentIndex]) {
        const item = schedule.items[currentIndex];
        if ("url" in item && item.url) {
          try {
            setCurrentMediaUrl(""); // Reset to show loading spinner
            setMediaError(""); // Clear any previous errors
            const fullUrl = await getMediaUrl(item.url);
            setCurrentMediaUrl(fullUrl);
          } catch (err) {
            console.error("Failed to load media URL:", err);
            setMediaError(
              err instanceof Error ? err.message : "Failed to load media file",
            );
            setCurrentMediaUrl("");
          }
        } else {
          setCurrentMediaUrl("");
          setMediaError("");
        }
      }
    };
    loadMediaUrl();
  }, [schedule, currentIndex]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (schedule && currentIndex < schedule.items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleContinue = () => {
    if (schedule && currentIndex < schedule.items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Schedule finished - navigate back to themes
      navigate("/themes");
    }
  };

  const handleRecord = async () => {
    if (recording.isRecording) {
      // Stop recording
      setSaving(true);
      try {
        const currentItem = schedule!.items[currentIndex];
        const itemId = currentItem.itemId;
        // TODO: Get clientId from app preferences/storage
        const clientId = "test-client-id";

        const response = await recording.stopRecording(itemId, clientId);
        console.log("Recording saved:", response);

        // Update total recorded time
        if (response) {
          const durationSeconds = Math.floor(response.durationSeconds);
          addRecordedSeconds(durationSeconds);
          totalRecorded.refresh();
        }

        // Trigger auto-upload of pending recordings
        autoUpload.uploadNow();

        // Move to next item or finish
        handleContinue();
      } catch (err) {
        console.error("Error saving recording:", err);
        setError(
          err instanceof Error ? err.message : "Failed to save recording",
        );
      } finally {
        setSaving(false);
      }
    } else {
      // Start recording
      try {
        await recording.startRecording();
      } catch (err) {
        console.error("Error starting recording:", err);
        setError(
          err instanceof Error ? err.message : "Failed to start recording",
        );
      }
    }
  };

  const handleBack = () => {
    navigate("/themes");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
        <div className="mb-5 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error || "Failed to load schedule"}
        </div>
        <button
          onClick={handleBack}
          style={{
            backgroundColor: "#3B82F6",
            color: "white",
            padding: "0.5rem 1.5rem",
            borderRadius: "0.25rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Back to Themes
        </button>
      </div>
    );
  }

  const currentItem = schedule.items[currentIndex];
  const isMedia = isMediaItem(currentItem);
  const isPrompt = isPromptItem(currentItem);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < schedule.items.length - 1;
  const isLastItem = currentIndex === schedule.items.length - 1;

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
            YOU HAVE DONATED
          </div>
          <div className="text-lg font-semibold text-blue-600">
            {totalRecorded.totalFormatted}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-32">
        <div className="max-w-2xl mx-auto px-5 py-6">
          {/* Media Content */}
          {isMedia && (
            <div className="mb-6">
              {mediaError && (
                <div className="bg-red-100 border border-red-400 text-red-700 rounded-lg p-4 mb-4">
                  <strong>Media Error:</strong> {mediaError}
                </div>
              )}
              {currentItem.itemType === "image" &&
                "url" in currentItem &&
                currentMediaUrl && (
                  <img
                    src={currentMediaUrl}
                    alt={currentItem.description}
                    className="w-full rounded-lg shadow-md"
                    style={{ maxHeight: "300px", objectFit: "cover" }}
                  />
                )}
              {(currentItem.itemType === "video" ||
                currentItem.itemType === "yle-video") &&
                "url" in currentItem &&
                currentMediaUrl && (
                  <VideoPlayer
                    url={currentMediaUrl}
                    description={currentItem.description}
                  />
                )}
              {(currentItem.itemType === "audio" ||
                currentItem.itemType === "yle-audio") &&
                "url" in currentItem &&
                currentMediaUrl && (
                  <AudioPlayer
                    url={currentMediaUrl}
                    description={currentItem.description}
                  />
                )}
              {!currentMediaUrl &&
                !mediaError &&
                "url" in currentItem &&
                currentItem.url && (
                  <div className="bg-gray-200 rounded-lg shadow-md p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading media...</p>
                  </div>
                )}
              {currentItem.itemType === "text-content" &&
                "url" in currentItem && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <p className="text-gray-700">{currentItem.description}</p>
                  </div>
                )}
            </div>
          )}

          {/* Navigation Arrows and Counter */}
          <div className="flex items-center justify-between mb-6 px-4">
            <button
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "transparent",
                border: "none",
                cursor: canGoPrevious ? "pointer" : "not-allowed",
                opacity: canGoPrevious ? 1 : 0,
                fontSize: "2rem",
                color: "#3B82F6",
              }}
            >
              ‹
            </button>

            <div className="text-center flex-1">
              <span className="text-lg font-semibold text-blue-600 uppercase">
                {currentIndex + 1} / {schedule.items.length}
              </span>
            </div>

            <button
              onClick={handleNext}
              disabled={!canGoNext}
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "transparent",
                border: "none",
                cursor: canGoNext ? "pointer" : "not-allowed",
                opacity: canGoNext ? 1 : 0,
                fontSize: "2rem",
                color: "#3B82F6",
              }}
            >
              ›
            </button>
          </div>

          {/* Item Content */}
          <div className="px-4">
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">
              {currentItem.description}
            </h2>

            {/* Prompt Items */}
            {isPrompt && (
              <div className="mt-6">
                {(currentItem.itemType === "choice" ||
                  currentItem.itemType === "multi-choice" ||
                  currentItem.itemType === "super-choice") &&
                  "options" in currentItem && (
                    <div className="space-y-3">
                      {currentItem.options.map((option, idx) => (
                        <button
                          key={idx}
                          className="w-full p-4 text-left bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          {option}
                        </button>
                      ))}
                      {currentItem.itemType !== "choice" &&
                        "otherEntryLabel" in currentItem &&
                        currentItem.otherEntryLabel && (
                          <input
                            type="text"
                            placeholder={currentItem.otherEntryLabel}
                            className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                        )}
                    </div>
                  )}
                {currentItem.itemType === "text-input" && (
                  <textarea
                    placeholder="Enter your answer..."
                    rows={4}
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                  ></textarea>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Button Bar */}
      {isMedia && currentItem.isRecording && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 flex flex-col items-center">
          {saving && (
            <div className="mb-4 text-blue-600 font-semibold">
              Saving recording...
            </div>
          )}
          {recording.error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {recording.error}
            </div>
          )}
          <button
            onClick={handleRecord}
            disabled={saving}
            style={{
              width: "91px",
              height: "91px",
              borderRadius: "50%",
              backgroundColor: recording.isRecording ? "#10B981" : "#EF4444",
              color: "white",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "600",
              opacity: saving ? 0.5 : 1,
            }}
          >
            {recording.isRecording ? "STOP" : "RECORD"}
          </button>
          <div className="mt-3 text-2xl font-mono text-gray-700">
            {formatDuration(recording.duration)}
          </div>
        </div>
      )}

      {(isPrompt || (isMedia && !currentItem.isRecording)) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 flex flex-col items-center space-y-3">
          <button
            onClick={handleContinue}
            style={{
              backgroundColor: "#3B82F6",
              color: "white",
              padding: "0.75rem 2rem",
              borderRadius: "0.5rem",
              border: "none",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600",
              minWidth: "220px",
            }}
          >
            {isLastItem ? "FINISH" : "CONTINUE"}
          </button>
        </div>
      )}
    </div>
  );
}
