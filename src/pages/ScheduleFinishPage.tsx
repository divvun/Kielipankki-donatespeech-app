import { useNavigate, useLocation } from "react-router-dom";
import { useTotalRecorded } from "../hooks/useTotalRecorded";
import { getTotalRecordedSeconds } from "../utils/preferences";
import { useTranslation } from "../hooks/useTranslation";
import { Schedule } from "../types/Schedule";
import { getLocalizedText } from "../utils/localization";
import { useLocalization } from "../contexts/LocalizationContext";
import { ScheduleNavigationBar } from "../components/ScheduleNavigationBar";
import { ScheduleFinishSummary } from "../components/ScheduleFinishSummary";

interface ScheduleFinishLocationState {
  schedule?: Schedule;
  itemsCompleted?: number;
}

export default function ScheduleFinishPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const totalRecorded = useTotalRecorded();
  const { getString } = useTranslation();
  const { currentLanguage } = useLocalization();

  const state = location.state as ScheduleFinishLocationState | undefined;
  const schedule = state?.schedule;

  const handleInviteFriend = async () => {
    const totalSeconds = getTotalRecordedSeconds();
    const minutes = Math.floor(totalSeconds / 60);

    let shareTemplate = getString("InviteFriendTemplate");
    if (minutes < 2) {
      shareTemplate = getString("InviteFriendNewbieTemplate");
    }

    // Format the share text with minutes parameter
    const shareText = shareTemplate.replace("{$param0}", minutes.toString());

    console.log("Share text:", shareText);

    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: getString("InviteFriendTitle"),
          text: shareText,
        });
        console.log("Shared successfully");
      } catch (err) {
        console.log("Share cancelled or failed:", err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Share text copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy:", err);
        alert("Sharing is not supported on this device");
      }
    }
  };

  const handleDonateMore = () => {
    console.log("Navigating to themes from donate more button");
    navigate("/themes", { replace: true });
  };

  const handleBack = () => {
    console.log("Navigating to themes from back button");
    navigate("/themes", { replace: true });
  };

  const finishTitle = schedule?.finish?.title
    ? getLocalizedText(schedule.finish.title, currentLanguage)
    : getString("RecordingFinishTitle");
  const finishBody1 = schedule?.finish?.body1
    ? getLocalizedText(schedule.finish.body1, currentLanguage)
    : "";
  const finishBody2 = schedule?.finish?.body2
    ? getLocalizedText(schedule.finish.body2, currentLanguage)
    : "";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <ScheduleNavigationBar
        onBack={handleBack}
        donatedLabel={getString("DonatedLabelText")}
        totalRecorded={totalRecorded.totalFormatted}
      />

      <ScheduleFinishSummary
        finishImageUrl={schedule?.finish?.imageUrl}
        title={finishTitle}
        body1={finishBody1}
        body2={finishBody2}
        totalRecorded={totalRecorded.totalFormatted}
      />

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 flex flex-col items-center space-y-3">
        <button
          onClick={handleInviteFriend}
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
          {getString("InviteFriendButtonText")}
        </button>

        <button
          onClick={handleDonateMore}
          style={{
            backgroundColor: "white",
            color: "#3B82F6",
            padding: "0.75rem 2rem",
            borderRadius: "0.5rem",
            border: "2px solid #3B82F6",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "600",
            minWidth: "230px",
          }}
        >
          {getString("DonateMoreButtonText")}
        </button>
      </div>
    </div>
  );
}
