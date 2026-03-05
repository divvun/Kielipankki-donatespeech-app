import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useParams, useNavigate } from "react-router-dom";
import type { Schedule } from "../types/Schedule";
import { isMediaItem, isPromptItem } from "../types/Schedule";
import { useRecording, formatDuration } from "../hooks/useRecording";
import { ScheduleNavigationBar } from "../components/ScheduleNavigationBar";
import { ScheduleMediaSection } from "../components/ScheduleMediaSection";
import { ScheduleItemNavigator } from "../components/ScheduleItemNavigator";
import { ScheduleItemContent } from "../components/ScheduleItemContent";
import { ScheduleRecordingBar } from "../components/ScheduleRecordingBar";
import { getMediaUrl } from "../utils/mediaUrl";
import { useTotalRecorded } from "../hooks/useTotalRecorded";
import { addRecordedSeconds } from "../utils/preferences";
import { useAutoUpload } from "../hooks/useAutoUpload";
import { getClientId } from "../utils/clientId";
import { useTranslation } from "../hooks/useTranslation";
import { getLocalizedText } from "../utils/localization";
import { useItemState } from "../hooks/useItemState";
import { useLocalization } from "../contexts/LocalizationContext";

const isFakeYleMediaType = (itemType: string) =>
  itemType === "fake-yle-audio" || itemType === "fake-yle-video";

export default function SchedulePage() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const { getString } = useTranslation();
  const { currentLanguage } = useLocalization();

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string>("");
  const [mediaError, setMediaError] = useState<string>("");
  // Store answers for prompt items (itemId -> answer)
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Callback when max recording time is reached
  const handleMaxTimeReached = async () => {
    // Auto-stop recording and save it
    setSaving(true);
    try {
      if (!schedule) return;

      const currentItem = schedule.items[currentIndex];
      const itemId = currentItem.itemId;
      const clientId = getClientId();

      const response = await recording.stopRecording(itemId, clientId);
      console.log("Recording auto-stopped at max time:", response);

      // Update total recorded time
      if (response) {
        const durationSeconds = Math.floor(response.durationSeconds);
        addRecordedSeconds(durationSeconds);
        totalRecorded.refresh();
      }

      // Trigger auto-upload
      autoUpload.uploadNow();

      // Show alert
      alert(
        `${getString("RecordingStoppedLimitTitle")}\n\n${getString("RecordingStoppedLimitMessage")}`,
      );

      // Move to next item or finish
      handleContinue();
    } catch (err) {
      console.error("Error auto-stopping recording:", err);
      setError(err instanceof Error ? err.message : "Failed to save recording");
    } finally {
      setSaving(false);
    }
  };

  // Callback when approaching max recording time (9 minutes)
  const handleWarningThreshold = () => {
    alert(getString("RecordingApproachingLimitMessage"));
  };

  const recording = useRecording(handleMaxTimeReached, handleWarningThreshold);
  const totalRecorded = useTotalRecorded();
  const autoUpload = useAutoUpload();

  // Get current item and its state
  const currentItem = schedule?.items[currentIndex] || null;
  const { currentState, stateContent, transitionTo } = useItemState(
    currentItem,
    recording.isRecording,
  );

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
        setError(getString("SchedulePageNoItemsError"));
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

        // Fake YLE items should keep the same flow as normal media items,
        // but never attempt playback/download.
        if (isFakeYleMediaType(item.itemType)) {
          setCurrentMediaUrl("");
          setMediaError("");
          return;
        }

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
    console.log(
      "handleContinue called, currentIndex:",
      currentIndex,
      "total items:",
      schedule?.items.length,
    );
    if (schedule && currentIndex < schedule.items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Schedule finished - navigate to finish page
      if (schedule && scheduleId) {
        console.log("Navigating to finish page for schedule:", scheduleId);
        navigate(`/schedule/${scheduleId}/finish`, {
          state: {
            schedule: schedule,
            itemsCompleted: schedule.items.length,
          },
          replace: true,
        });
      } else {
        console.error(
          "Cannot navigate to finish: schedule or scheduleId missing",
          { schedule, scheduleId },
        );
      }
    }
  };

  const handleRecord = async () => {
    if (recording.isRecording) {
      // Stop recording and transition to finish state
      transitionTo("finish");
      setSaving(true);
      try {
        const currentItem = schedule!.items[currentIndex];
        const itemId = currentItem.itemId;
        const clientId = getClientId();

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
      } catch (err) {
        console.error("Error saving recording:", err);
        setError(
          err instanceof Error ? err.message : "Failed to save recording",
        );
      } finally {
        setSaving(false);
      }
    } else {
      // Start recording and transition to start then recording state
      transitionTo("start");
      try {
        await recording.startRecording();
        // The useItemState hook will auto-transition to "recording" when isRecording becomes true
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

  if (error || !schedule || !currentItem) {
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

  const isMedia = isMediaItem(currentItem);
  const isPrompt = isPromptItem(currentItem);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < schedule.items.length - 1;
  const isLastItem = currentIndex === schedule.items.length - 1;
  const isFakeYleItem = isFakeYleMediaType(currentItem.itemType);
  const isRecordingMediaItem =
    isMedia && "isRecording" in currentItem && currentItem.isRecording;
  const showRecordButtonBar = isRecordingMediaItem && currentState !== "finish";
  const showManualContinueAfterFinish =
    isRecordingMediaItem && currentState === "finish";
  const showContinueButtonBar =
    isPrompt ||
    (isMedia && !isRecordingMediaItem) ||
    showManualContinueAfterFinish;

  // Get localized content from state
  const title = getLocalizedText(stateContent.title, currentLanguage);
  const body1 = getLocalizedText(stateContent.body1, currentLanguage);
  const body2 = getLocalizedText(stateContent.body2, currentLanguage);
  const stateImageUrl = stateContent.imageUrl;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <ScheduleNavigationBar
        onBack={handleBack}
        donatedLabel={getString("DonatedLabelText")}
        totalRecorded={totalRecorded.totalFormatted}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-32">
        <div className="max-w-2xl mx-auto px-5 py-6">
          {/* Media Content */}
          {isMedia && (
            <ScheduleMediaSection
              currentItem={currentItem}
              mediaError={mediaError}
              isFakeYleItem={isFakeYleItem}
              stateImageUrl={stateImageUrl}
              title={title}
              currentMediaUrl={currentMediaUrl}
              getString={getString}
            />
          )}

          <ScheduleItemNavigator
            onPrevious={handlePrevious}
            onNext={handleNext}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            currentIndex={currentIndex}
            totalItems={schedule.items.length}
          />

          <ScheduleItemContent
            currentItem={currentItem}
            title={title}
            body1={body1}
            body2={body2}
            answers={answers}
            onAnswerChange={(itemId, answer) =>
              setAnswers((prev) => ({
                ...prev,
                [itemId]: answer,
              }))
            }
          />
        </div>
      </div>

      {/* Bottom Button Bar */}
      {showRecordButtonBar && (
        <ScheduleRecordingBar
          saving={saving}
          error={recording.error}
          onRecord={handleRecord}
          isRecording={recording.isRecording}
          startLabel={getString("StartRecording")}
          stopLabel={getString("StopRecording")}
          durationText={formatDuration(recording.duration)}
        />
      )}

      {showContinueButtonBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 flex flex-col items-center space-y-3">
          {showManualContinueAfterFinish && saving && (
            <div className="text-blue-600 font-semibold">
              Saving recording...
            </div>
          )}
          {showManualContinueAfterFinish && recording.error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {recording.error}
            </div>
          )}
          <button
            onClick={handleContinue}
            disabled={saving}
            style={{
              backgroundColor: "#3B82F6",
              color: "white",
              padding: "0.75rem 2rem",
              borderRadius: "0.5rem",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "600",
              minWidth: "220px",
              opacity: saving ? 0.5 : 1,
            }}
          >
            {isLastItem
              ? getString("ExitButtonText")
              : getString("ContinueSchedule")}
          </button>
        </div>
      )}
    </div>
  );
}
